import { BigNumber as BN } from 'bignumber.js'
import { ethers, Contract } from 'ethers'
import {
    Amounts,
    FactoryPair,
    GasData,
    Pair,
    Profcalcs,
    Repays,
    TradePair,
} from '../../constants/interfaces'
import { abi as IFactory } from '@uniswap/v2-core/build/IUniswapV2Factory.json'
import { abi as IRouter } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { flashMulti, flashDirect } from '../../constants/environment'
import { provider, wallet } from '../../constants/provider'
import { Prices } from './modules/prices'
import { getK } from './modules/getK'
import { BoolTrade } from '../../constants/interfaces'
import { PopulateRepays } from './modules/populateRepays'
import { getAmountsIn, getAmountsOut } from './modules/getAmountsIOLocal'
import { AmountConverter } from './modules/amountConverter'
import {
    BigInt2BN,
    BigInt2String,
    BN2BigInt,
    fu,
    pu,
} from '../modules/convertBN'
import { filterTrade } from './modules/filterTrade'
import { logger } from '../../constants/logger'
import { ProfitCalculator } from './modules/ProfitCalcs'

/**
 * @description
 * Class to determine trade parameters
 * returns a BoolTrade object, which fills out all params needed for a trade.
 *
 */
export class Trade {
    // trade: BoolTrade
    pair: FactoryPair
    match: TradePair
    price0: Prices
    price1: Prices
    slip: BN
    gasData: GasData
    calc0: AmountConverter
    calc1: AmountConverter

    constructor(
        pair: FactoryPair,
        match: TradePair,
        price0: Prices,
        price1: Prices,
        slip: BN,
        gasData: GasData
        // trade: BoolTrade
    ) {
        this.pair = pair
        this.price0 = price0
        this.price1 = price1
        this.match = match
        this.slip = slip
        this.gasData = gasData
        // Pass in the opposing pool's priceOut as target
        this.calc0 = new AmountConverter(price0, match, this.price1.priceOutBN)
        this.calc1 = new AmountConverter(price1, match, this.price0.priceOutBN)
    }

    async direction() {
        const A = this.price0.priceOutBN
        const B = this.price1.priceOutBN
        const diff = A.lt(B) ? B.minus(A) : A.minus(B)
        const dperc = diff.div(A.gt(B) ? A : B).multipliedBy(100) // 0.6% price difference required for trade (0.3%) + loan repayment (0.3%) on Uniswap V2

        //It would seem like you want to 'buy' the cheaper token, but you actually want to 'sell' the more expensive token.

        /*
		ex:
		A: eth/usd = 1/3000 = on uniswap
		B: eth/usd = 1/3100 = on sushiswap
		borrow eth on uniswap, sell on sushiswap for 3100 = $100 profit minus fees.
		*/

        const dir = A.gt(B) ? 'A' : 'B'
        //borrow from the pool with the higher priceOut, sell on the pool with the lower priceOut
        return { dir, diff, dperc }
    }

    async getSize(
        loan: AmountConverter,
        target: AmountConverter
    ): Promise<bigint> {
        const toPrice = await target.tradeToPrice()
        // use maxIn, maxOut to make sure the trade doesn't revert due to too much slippage on target
        const maxIn = await target.getMaxTokenIn()
        const bestSize = toPrice < maxIn ? toPrice : maxIn
        const safeReserves = (loan.reserves.reserveIn * 1000n) / 800n
        const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize
        // const msg = size.eq(safeReserves) ? "[getSize]: using safeReserves" : "[getSize]: using bestSize";
        // console.log(msg);
        return size
    }

    async getTrade() {
        const dir = await this.direction()
        const A = dir.dir == 'A' ? true : false
        const size = A
            ? await this.getSize(this.calc1, this.calc0)
            : await this.getSize(this.calc0, this.calc1)

        //TODO: Add Balancer, Aave, Compound, Dydx, etc. here.
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.

        const trade: BoolTrade = {
            ID: A
                ? this.match.poolAID + this.match.poolBID
                : this.match.poolBID + this.match.poolAID,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: 'filtered',
            ticker: this.match.token0.symbol + '/' + this.match.token1.symbol,
            tokenIn: this.match.token0,
            tokenOut: this.match.token1,
            flash: flashMulti, // flashMulti, // This has to be set initially, but must be changed later per type.
            loanPool: {
                exchange: A ? this.pair.exchangeB : this.pair.exchangeA,
                factory: A
                    ? new Contract(this.pair.factoryB_id, IFactory, provider)
                    : new Contract(this.pair.factoryA_id, IFactory, provider),
                router: A
                    ? new Contract(this.pair.routerB_id, IRouter, provider)
                    : new Contract(this.pair.routerA_id, IRouter, provider),
                pool: A
                    ? new Contract(this.match.poolBID, IPair, provider)
                    : new Contract(this.match.poolAID, IPair, provider),
                reserveIn: A
                    ? this.price1.reserves.reserveIn
                    : this.price0.reserves.reserveIn,
                reserveInBN: A
                    ? this.price1.reserves.reserveInBN
                    : this.price0.reserves.reserveInBN,
                reserveOut: A
                    ? this.price1.reserves.reserveOut
                    : this.price0.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price1.reserves.reserveOutBN
                    : this.price0.reserves.reserveOutBN,
                priceIn: A
                    ? this.price1.priceInBN.toFixed(this.match.token0.decimals)
                    : this.price0.priceInBN.toFixed(this.match.token0.decimals),
                priceOut: A
                    ? this.price1.priceOutBN.toFixed(this.match.token1.decimals)
                    : this.price0.priceOutBN.toFixed(
                          this.match.token1.decimals
                      ),
                repays: {
                    direct: 0n,
                    directInTokenOut: 0n,
                    simpleMulti: 0n,
                    getAmountsOut: 0n,
                    getAmountsIn: 0n,
                    repay: 0n,
                },
                amountRepay: 0n,
                amountOutToken0for1: 0n,
                amountOut: 0n,
            },
            target: {
                exchange: A ? this.pair.exchangeA : this.pair.exchangeB,
                factory: A
                    ? new Contract(this.pair.factoryA_id, IFactory, provider)
                    : new Contract(this.pair.factoryB_id, IFactory, provider),
                router: A
                    ? new Contract(this.pair.routerA_id, IRouter, provider)
                    : new Contract(this.pair.routerB_id, IRouter, provider),
                pool: A
                    ? new Contract(this.match.poolAID, IPair, provider)
                    : new Contract(this.match.poolBID, IPair, provider),
                reserveIn: A
                    ? this.price0.reserves.reserveIn
                    : this.price1.reserves.reserveIn,
                reserveInBN: A
                    ? this.price0.reserves.reserveInBN
                    : this.price1.reserves.reserveInBN,
                reserveOut: A
                    ? this.price0.reserves.reserveOut
                    : this.price1.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price0.reserves.reserveOutBN
                    : this.price1.reserves.reserveOutBN,
                priceIn: A
                    ? this.price0.priceInBN.toFixed(this.match.token0.decimals)
                    : this.price1.priceInBN.toFixed(this.match.token0.decimals),
                priceOut: A
                    ? this.price0.priceOutBN.toFixed(this.match.token1.decimals)
                    : this.price1.priceOutBN.toFixed(
                          this.match.token1.decimals
                      ),
                //TODO: FIX THE CALCS FOR MAXIN() WHICH ARE WRONG.
                tradeSize: size,
                amountOutToken0for1: 0n,
                amountOut: 0n,
            },
            k: {
                uniswapKPre: 0n,
                uniswapKPost: 0n,
                uniswapKPositive: false,
            },
            gasData: this.gasData,
            differenceTokenOut:
                dir.diff.toFixed(this.match.token1.decimals) +
                ' ' +
                this.match.token1.symbol,
            differencePercent:
                dir.dperc.toFixed(this.match.token1.decimals) + '%',
            profit: 0n,
            profitPercent: 0n,
        }
        const amountOut = await getAmountsOut(
            trade.target.tradeSize, // token0 in given
            trade.target.reserveIn, // token0 in
            trade.target.reserveOut
        ) // token1 max out

        trade.target.amountOut = await this.calc0.subSlippage(
            amountOut,
            trade.tokenOut.decimals
        )

        const filteredTrade = await filterTrade(trade)
        if (filteredTrade == undefined) {
            return trade
        }

        // Define repay & profit for each trade type:
        const r = new PopulateRepays(trade, this.calc0)
        const repays = await r.getRepays()
        const p = new ProfitCalculator(trade, this.calc0, repays)

        const multi = await p.getMultiProfit()
        // console.log('multi: ')
        // console.log(multi)
        const direct = await p.getDirectProfit()
        // console.log('direct: ')
        // console.log(direct)

        // subtract the result from amountOut to get profit
        // The below will be either in token0 or token1, depending on the trade type.
        // Set repayCalculation here for testing, until you find the correct answer (of which there is only 1):
        trade.loanPool.amountOut = await getAmountsOut(
            trade.target.tradeSize,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut
        )
        trade.loanPool.amountOutToken0for1 = await getAmountsOut(
            trade.target.amountOut,
            trade.loanPool.reserveOut,
            trade.loanPool.reserveIn
        )

        trade.type =
            multi.profit > direct.profit
                ? 'multi'
                : direct.profit > multi.profit
                ? 'direct'
                : 'No Profit (Error in profitCalcs)'

        trade.loanPool.amountRepay =
            trade.type === 'multi' ? repays.repay : repays.direct

        trade.loanPool.repays = repays

        trade.target.amountOutToken0for1 = await getAmountsOut(
            trade.target.amountOut,
            trade.target.reserveOut,
            trade.target.reserveIn
        )

        trade.profit = trade.type === 'multi' ? multi.profit : direct.profit

        trade.profitPercent =
            trade.type == 'multi'
                ? pu(
                      multi.profitPercent.toFixed(trade.tokenOut.decimals),
                      trade.tokenOut.decimals
                  )
                : pu(
                      direct.profitPercent.toFixed(trade.tokenOut.decimals),
                      trade.tokenOut.decimals
                  )

        trade.k = await getK(
            trade.type,
            trade.target.tradeSize,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            this.calc0
        )

        trade.flash = trade.type === 'multi' ? flashMulti : flashDirect

        // return trade;
        return trade
    }
}
