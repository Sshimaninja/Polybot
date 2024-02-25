import { BigNumber as BN } from "bignumber.js";
import { ethers, Contract } from "ethers";
import {
    Amounts,
    FactoryPair,
    GasData,
    Pair,
    Profcalcs,
    Repays,
    TradePair,
} from "../../../constants/interfaces";
import { abi as IFactory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IRouter } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { flashMulti, flashSingle } from "../../../constants/environment";
import { provider, wallet } from "../../../constants/provider";
import { Prices } from "./Prices";
import { getK } from "../modules/tools/getK";
import { BoolTrade } from "../../../constants/interfaces";
import { PopulateRepays } from "./Repays";
import { AmountConverter } from "./AmountConverter";
import { BigInt2BN, BigInt2String, BN2BigInt, fu, pu } from "../../modules/convertBN";
import { filterTrade } from "../modules/filterTrade";
import { logger } from "../../../constants/logger";
import { ProfitCalculator } from "./ProfitCalcs";
import { getAmountsOut, getAmountsIn } from "../modules/getAmounts/getAmountsIOJS";
// import { getAmountsOut as getAmountOutBN, getAmountsIn as getAmountInBN } from "./modules/getAmounts/getAmountsIOBN";

/**
 * @description
 * Class to determine trade parameters
 * returns a BoolTrade object, which fills out all params needed for a trade.
 *
 */
export class Trade {
    // trade: BoolTrade
    pair: FactoryPair;
    match: TradePair;
    price0: Prices;
    price1: Prices;
    slip: BN;
    gasData: GasData;
    calc0: AmountConverter;
    calc1: AmountConverter;

    constructor(
        pair: FactoryPair,
        match: TradePair,
        price0: Prices,
        price1: Prices,
        slip: BN,
        gasData: GasData,
        // trade: BoolTrade
    ) {
        this.pair = pair;
        this.price0 = price0;
        this.price1 = price1;
        this.match = match;
        this.slip = slip;
        this.gasData = gasData;
        // Pass in the opposing pool's priceOut as target
        this.calc0 = new AmountConverter(price0, match, this.price1.priceOutBN);
        this.calc1 = new AmountConverter(price1, match, this.price0.priceOutBN);
    }

    async direction() {
        const A = this.price0.priceOutBN;
        const B = this.price1.priceOutBN;
        const diff = A.lt(B) ? B.minus(A) : A.minus(B);
        const dperc = diff.div(A.gt(B) ? A : B).multipliedBy(100); // 0.6% price difference required for trade (0.3%) + loan repayment (0.3%) on Uniswap V2

        //It would seem like you want to 'buy' the cheaper token, but you actually want to 'sell' the more expensive token.

        /*
		ex:
		A: eth/usd = 1/3000 = on uniswap
		B: eth/usd = 1/3100 = on sushiswap
		borrow eth on uniswap, sell on sushiswap for 3100 = $100 profit minus fees.
		*/

        const dir = A.gt(B) ? "A" : "B";
        //borrow from the pool with the higher priceOut, sell on the pool with the lower priceOut
        return { dir, diff, dperc };
    }

    async getSize(loan: AmountConverter, target: AmountConverter): Promise<bigint> {
        const toPrice = await target.tradeToPrice();
        // use maxIn, maxOut to make sure the trade doesn't revert due to too much slippage on target
        const maxIn = await target.getMaxTokenIn();
        const bestSize = toPrice < maxIn ? toPrice : maxIn;
        const safeReserves = (loan.reserves.reserveIn * 820n) / 1000n;
        //473 * 800 / 1000 = 378.4
        const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
        // const msg = size.eq(safeReserves) ? "[getSize]: using safeReserves" : "[getSize]: using bestSize";
        // console.log(msg);
        return size;
    }

    async getTrade() {
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.
        //TODO: SWITCH bot to trade from token1 to token0; token0 is more often WMATIC, which is easier to price.
        const dir = await this.direction();
        const A = dir.dir == "A" ? true : false;
        const size = A
            ? await this.getSize(this.calc1, this.calc0)
            : await this.getSize(this.calc0, this.calc1);
        const trade: BoolTrade = {
            ID: A
                ? this.match.poolBID + this.match.poolAID
                : this.match.poolAID + this.match.poolBID,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: "filtered",
            ticker: this.match.token0.symbol + "/" + this.match.token1.symbol,
            tokenIn: this.match.token1,
            tokenOut: this.match.token0,
            flash: flashMulti, // flashMulti, // This has to be set initially, but must be changed later per type. Likely to be flashMulti uneless other protocols are added for single swaps.
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
                reserveIn: A ? this.price1.reserves.reserveIn : this.price0.reserves.reserveIn,
                reserveInBN: A
                    ? this.price1.reserves.reserveInBN
                    : this.price0.reserves.reserveInBN,
                reserveOut: A ? this.price1.reserves.reserveOut : this.price0.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price1.reserves.reserveOutBN
                    : this.price0.reserves.reserveOutBN,
                priceIn: A
                    ? this.price1.priceInBN.toFixed(this.match.token1.decimals)
                    : this.price0.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.price1.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.price0.priceOutBN.toFixed(this.match.token0.decimals),
                amountOut: 0n,
                repays: {
                    single: { singleIn: 0n, singleOut: 0n },
                    multi: 0n,
                    repay: 0n,
                },
                amountRepay: 0n,
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
                reserveIn: A ? this.price0.reserves.reserveIn : this.price1.reserves.reserveIn,
                reserveInBN: A
                    ? this.price0.reserves.reserveInBN
                    : this.price1.reserves.reserveInBN,
                reserveOut: A ? this.price0.reserves.reserveOut : this.price1.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price0.reserves.reserveOutBN
                    : this.price1.reserves.reserveOutBN,
                priceIn: A
                    ? this.price0.priceInBN.toFixed(this.match.token1.decimals)
                    : this.price1.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.price0.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.price1.priceOutBN.toFixed(this.match.token0.decimals),
                //TODO: FIX THE CALCS FOR MAXIN() WHICH ARE WRONG.
                tradeSize: size,
                // amountOuttoken0for1: 0n,
                amountOut: 0n,
            },
            gas: this.gasData,
            k: {
                uniswapKPre: 0n,
                uniswapKPost: 0n,
                uniswapKPositive: false,
            },
            differenceTokenOut:
                dir.diff.toFixed(this.match.token0.decimals) + " " + this.match.token0.symbol,
            differencePercent: dir.dperc.toFixed(this.match.token0.decimals) + "%",
            profits: {
                profitToken: 0n,
                profitWMATIC: 0n,
                profitPercent: 0n,
            },
        };

        trade.target.amountOut = await getAmountsOut(
            trade.target.router, // token1 in given
            trade.target.tradeSize, // token1 in
            [trade.tokenIn.id, trade.tokenOut.id],
        ); // token0 max out

        trade.loanPool.amountOut = await getAmountsOut(
            trade.loanPool.router, // token1 in given
            trade.target.tradeSize, // token1 in
            [trade.tokenIn.id, trade.tokenOut.id],
        ); // token0 max out

        // // SUBTRACT SLIPPAGE FROM EXPECTED AMOUNTOUT. This is an attempt to offset 'INSUFFICIENT_OUTPUT_AMOUNT' errors.
        // trade.target.amountOut = await this.calc0.subSlippage(
        //     trade.target.amountOut,
        //     trade.tokenOut.decimals,
        // );

        // console.log("trade.target.amountOut minus slippage: ", trade.target.amountOut);

        //TODO: Add Balancer, Aave, Compound, Dydx, etc. here.
        // Define repay & profit for each trade type:
        const r = new PopulateRepays(trade, this.calc0);
        const repays = await r.getRepays();
        const p = new ProfitCalculator(trade, this.calc0, repays);

        const multi = await p.getMultiProfit();
        const single = await p.getSingleProfit();

        // subtract the result from amountOut to get profit
        // The below will be either in token1 or token0, depending on the trade type.
        // Set repayCalculation here for testing, until you find the correct answer (of which there is only 1):

        // if (filteredTrade == undefined) {
        //     return trade;
        // }
        //TODO: CHANGE 'SINGLE' TO 'SINGLE' to reflect uniswap docs.
        trade.type =
            multi.profit > single.profit
                ? "multi"
                : single.profit > multi.profit
                ? "single"
                : "No Profit: multi: " + multi.profit + " single: " + single.profit;

        trade.loanPool.amountRepay =
            trade.type === "multi" ? repays.multi : repays.single.singleOut; // Must be calculated in tokenOut for this bot unless new contracts are added.

        trade.loanPool.repays = repays;

        trade.profits.profitToken = trade.type === "multi" ? multi.profit : single.profit;

        trade.profits.profitPercent =
            trade.type == "multi"
                ? pu(multi.profitPercent.toFixed(trade.tokenOut.decimals), trade.tokenOut.decimals)
                : pu(
                      single.profitPercent.toFixed(trade.tokenOut.decimals),
                      trade.tokenOut.decimals,
                  );

        trade.k = await getK(
            trade.type,
            trade.target.tradeSize,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            this.calc0,
        );

        trade.flash = trade.type === "multi" ? flashMulti : flashSingle;
        await filterTrade(trade);

        // return trade;
        return trade;
    }
}
