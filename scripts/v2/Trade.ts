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
} from "../../constants/interfaces";
import { abi as IFactory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IRouter } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { flashMulti, flashSingle } from "../../constants/environment";
import { provider, wallet } from "../../constants/provider";
import { Prices } from "./modules/prices";
import { getK } from "./modules/getK";
import { BoolTrade } from "../../constants/interfaces";
import { PopulateRepays } from "./modules/getRepays";
// import { getAmountsIn, getAmountsOut } from "./modules/getAmountsIOLocal";
import { AmountConverter } from "./modules/amountConverter";
import { BigInt2BN, BigInt2String, BN2BigInt, fu, pu } from "../modules/convertBN";
import { filterTrade } from "./modules/filterTrade";
import { checkTrade } from "./modules/checkTrade";
import { logger } from "../../constants/logger";
import { ProfitCalculator } from "./modules/ProfitCalcs";
import { getAmountsOut, getAmountsIn } from "./modules/getAmountsIOJS";
// import { getAmountsOut as getAmountOutBN, getAmountsIn as getAmountInBN } from "./modules/getAmountsIOBN";

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
    reservesA: Prices;
    reservesB: Prices;
    slip: BN;
    gasData: GasData;
    calcA: AmountConverter;
    calcB: AmountConverter;

    constructor(
        pair: FactoryPair,
        match: TradePair,
        reservesA: Prices,
        reservesB: Prices,
        slip: BN,
        gasData: GasData,
        // trade: BoolTrade
    ) {
        this.pair = pair;
        this.reservesA = reservesA;
        this.reservesB = reservesB;
        this.match = match;
        this.slip = slip;
        this.gasData = gasData;
        // Pass in the opposing pool's priceOut as target
        this.calcA = new AmountConverter(reservesA, reservesB, match);
        this.calcB = new AmountConverter(reservesB, reservesA, match);
    }

    async direction() {
        const A = this.reservesA.priceOutBN;
        const B = this.reservesB.priceOutBN;
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

    async getTrade() {
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.
        const dir = await this.direction();
        const A = dir.dir == "A" ? true : false;
        const size = A ? await this.calcA.getSize() : await this.calcB.getSize();
        const trade: BoolTrade = {
            ID: A
                ? this.match.poolAID + this.match.poolBID
                : this.match.poolBID + this.match.poolAID,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: "filtered",
            ticker: this.match.token0.symbol + "/" + this.match.token1.symbol,
            tokenIn: this.match.token0,
            tokenOut: this.match.token1,
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
                reserveIn: A
                    ? this.reservesB.reserves.reserveIn
                    : this.reservesA.reserves.reserveIn,
                reserveInBN: A
                    ? this.reservesB.reserves.reserveInBN
                    : this.reservesA.reserves.reserveInBN,
                reserveOut: A
                    ? this.reservesB.reserves.reserveOut
                    : this.reservesA.reserves.reserveOut,
                reserveOutBN: A
                    ? this.reservesB.reserves.reserveOutBN
                    : this.reservesA.reserves.reserveOutBN,
                priceIn: A
                    ? this.reservesB.priceInBN.toFixed(this.match.token0.decimals)
                    : this.reservesA.priceInBN.toFixed(this.match.token0.decimals),
                priceOut: A
                    ? this.reservesB.priceOutBN.toFixed(this.match.token1.decimals)
                    : this.reservesA.priceOutBN.toFixed(this.match.token1.decimals),
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
                reserveIn: A
                    ? this.reservesA.reserves.reserveIn
                    : this.reservesB.reserves.reserveIn,
                reserveInBN: A
                    ? this.reservesA.reserves.reserveInBN
                    : this.reservesB.reserves.reserveInBN,
                reserveOut: A
                    ? this.reservesA.reserves.reserveOut
                    : this.reservesB.reserves.reserveOut,
                reserveOutBN: A
                    ? this.reservesA.reserves.reserveOutBN
                    : this.reservesB.reserves.reserveOutBN,
                priceIn: A
                    ? this.reservesA.priceInBN.toFixed(this.match.token0.decimals)
                    : this.reservesB.priceInBN.toFixed(this.match.token0.decimals),
                priceOut: A
                    ? this.reservesA.priceOutBN.toFixed(this.match.token1.decimals)
                    : this.reservesB.priceOutBN.toFixed(this.match.token1.decimals),
                //TODO: FIX THE CALCS FOR MAXIN() WHICH ARE WRONG.
                tradeSize: size,
                amountOutToken0for1: 0n,
                amountOut: 0n,
            },
            gas: this.gasData,
            k: {
                uniswapKPre: 0n,
                uniswapKPost: 0n,
                uniswapKPositive: false,
            },
            differenceTokenOut:
                dir.diff.toFixed(this.match.token1.decimals) + " " + this.match.token1.symbol,
            differencePercent: dir.dperc.toFixed(this.match.token1.decimals) + "%",
            profits: {
                profitToken: 0n,
                profitWMATIC: 0n,
                profitPercent: 0n,
            },
        };

        trade.target.amountOut = await getAmountsOut(
            trade.target.router, // token0 in given
            trade.target.tradeSize, // token0 in
            [trade.tokenIn.id, trade.tokenOut.id],
        ); // token1 max out

        trade.loanPool.amountOut = await getAmountsOut(
            trade.loanPool.router, // token0 in given
            trade.target.tradeSize, // token0 in
            [trade.tokenIn.id, trade.tokenOut.id],
        ); // token1 max out

        // // SUBTRACT SLIPPAGE FROM EXPECTED AMOUNTOUT. This is an attempt to offset 'INSUFFICIENT_OUTPUT_AMOUNT' errors.
        trade.target.amountOut = await this.calcA.subSlippage(
            trade.target.amountOut,
            trade.tokenOut.decimals,
        );

        // console.log("trade.target.amountOut minus slippage: ", trade.target.amountOut);

        //TODO: Add Balancer, Aave, Compound, Dydx, etc. here.
        // Define repay & profit for each trade type:

        const r = new PopulateRepays(trade);
        const repays = await r.getRepays();
        const p = new ProfitCalculator(trade, repays);

        const multi = await p.getMultiProfit();
        // const single = await p.getSingleProfit();

        // subtract the result from amountOut to get profit
        // The below will be either in token0 or token1, depending on the trade type.
        // Set repayCalculation here for testing, until you find the correct answer (of which there is only 1):

        // if (filteredTrade == undefined) {
        //     return trade;
        // }

        //FORCE MULTI TRADE FOR NOW:

        trade.type = "multi";
        // multi.profit > single.profit
        //     ? "multi"
        //     : single.profit > multi.profit
        //     ? "single"
        //     : "No Profit: multi: " + multi.profit + " single: " + single.profit;

        trade.loanPool.amountRepay = repays.multi;
        // trade.type === "multi" ? repays.multi : repays.single.singleOut; // Must be calculated in tokenOut for this bot unless new contracts are added.

        trade.loanPool.repays = repays;

        trade.profits.profitToken = multi.profit; // trade.type === "multi" ? multi.profit : single.profit;

        trade.profits.profitPercent = pu(
            multi.profitPercent.toFixed(trade.tokenOut.decimals),
            trade.tokenOut.decimals,
        );
        // trade.type == "multi"
        //     ? pu(multi.profitPercent.toFixed(trade.tokenOut.decimals), trade.tokenOut.decimals)
        //     : pu(
        //           single.profitPercent.toFixed(trade.tokenOut.decimals),
        //           trade.tokenOut.decimals,
        //       );

        trade.k = await getK(
            trade.type,
            trade.target.tradeSize,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            this.calcA,
        );

        trade.flash = flashMulti; // trade.type === "multi" ? flashMulti : flashSingle;
        await filterTrade(trade);

        // return trade;
        return trade;
    }
}
