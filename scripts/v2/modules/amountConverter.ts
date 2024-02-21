import { BigNumber as BN } from "bignumber.js";
import { getMaxToken0In, getMaxToken0Out, tradeToPrice } from "./tradeMath";
import { Pair, ReservesData, TradePair } from "../../../constants/interfaces";
import { Prices } from "./prices";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { getGasData } from "./getPolygonGasPrices";
import { Token, Amounts } from "../../../constants/interfaces";
import { getAmountsOut, getAmountsIn } from "./getAmountsIOBN"; // we can use local calcs because precision is not required for this estimation
// import { getAmountsOut, getAmountsIn } from "./getAmountsIOJS";
import { HiLo, Difference } from "../../../constants/interfaces";
import { BN2BigInt, BigInt2BN, fu, pu } from "../../modules/convertBN";
import { slippageTolerance } from "../../v2/control";
import { provider } from "../../../constants/provider";
import { logger } from "../../../constants/logger";
import { ethers } from "hardhat";
import { uniswapV2Router } from "../../../constants/addresses";

/**
 * @description
 * This class holds amounts in/out for a pair, as well as the trade size.
 * Target price is re-intitialized as the average of two prices.
 */
export class AmountConverter {
    // targetRouter: string;
    // loanPoolRouter: string;
    tokenIn: Token;
    tokenOut: Token;
    low: Prices;
    high: Prices;
    slip: BN;

    constructor(
        // targetRouter: string,
        // loanPoolRouter: string,
        low: Prices,
        high: Prices,
        pair: TradePair,
    ) {
        // this.targetRouter = targetRouter;
        // this.loanPoolRouter = loanPoolRouter;
        this.low = low;
        this.high = high;
        this.slip = slippageTolerance;
        this.tokenIn = pair.token0;
        this.tokenOut = pair.token1;
    }

    /**
     * @returns Amounts in/out for a trade. Should never be negative.
     */
    // tradeToPrice gets a mid-level between price of pool and target price, and returns the amount of tokenIn needed to reach that price
    // can be limited by slippageTolerance if uniswap returns 'EXCESSIVE_INPUT_AMOUNT'
    // can be limited by maxIn if uniswap returns 'INSUFFICIENT_INPUT_AMOUNT'
    async protocolFee(n: BN) {
        let protocolFee = n.multipliedBy(0.003); // returns fee not price +/- fee.
        // logger.info("Transaction Fee: ", protocolFee.toFixed(this.tokenIn.decimals));
        return protocolFee; //subtract this from amountOut
    }

    async gasFees(n: BN) {
        let g = await getGasData();
        let gas = fu(g.gasPrice, 18);
        let gasBN = BN(gas);
        let gasInTokenOut = await getAmountsOut(
            gasBN,
            this.high.reserves.reserveInBN,
            this.high.reserves.reserveOutBN,
        );
        // let gasInTokenOutJS = await getAmountsOut(
        //     new ethers.Contract(this.targetRouter, IUniswapV2Router02, provider),
        //     g.gasPrice,
        //     [this.tokenIn.id, this.tokenOut.id],
        // // );
        // logger.info(
        //     "gasInTokenOut: ",
        //     gasInTokenOutLocal.toFixed(this.tokenOut.decimals),
        //     // "gasInTokenOut(Router): ",
        //     // fu(gasInTokenOutJS, this.tokenOut.decimals),
        //     " in ",
        //     // this.tokenOut.symbol,
        // );
        // logger.info(gas, " in gas fees");
        return BN(gasInTokenOut);
    }

    async txFees(n: BN) {
        let gas = await this.gasFees(n);
        let protocolFee = await this.protocolFee(n);
        let txFees = gas.plus(protocolFee);
        // logger.info(
        //     "txFees in tokenOut: ",
        //     txFees.toFixed(this.tokenOut.decimals),
        //     " in ",
        //     this.tokenOut.symbol,
        // );
        return txFees;
    }

    async calcMostProfitable(): Promise<BN> {
        if (this.low.priceOutBN.gt(this.high.priceOutBN)) {
            logger.info(
                "loanPool price (",
                this.low.priceOutBN.toFixed(this.tokenOut.decimals),
                ") must be lower than target: (",
                this.high.priceOutBN.toFixed(this.tokenOut.decimals),
                ")",
            );
            return BN(0);
        }

        let diff = this.high.priceOutBN.minus(this.low.priceOutBN);

        const maxToken0In = await getMaxToken0In(this.high.reserves.reserveInBN, this.slip);
        const maxToken0Out = await getMaxToken0Out(this.low.reserves.reserveInBN, this.slip);
        // logger.info(
        //     "maxToken0In:: ",
        //     maxToken0In.toFixed(this.tokenIn.decimals),
        //     this.tokenIn.symbol,
        // );
        // logger.info(
        //     "maxToken0Out: ",
        //     maxToken0Out.toFixed(this.tokenIn.decimals),
        //     this.tokenIn.symbol,
        // );

        let maxInProfit = maxToken0In.multipliedBy(diff);
        let maxOutProfit = maxToken0Out.multipliedBy(diff);
        // logger.info(
        //     "maxInProfit: ",
        //     maxInProfit.toFixed(this.tokenIn.decimals),
        //     this.tokenOut.symbol,
        // );
        // logger.info(
        //     "maxOutProfit: ",
        //     maxOutProfit.toFixed(this.tokenIn.decimals),
        //     this.tokenOut.symbol,
        // );

        maxInProfit = maxInProfit.minus(await this.txFees(maxInProfit));
        maxOutProfit = maxOutProfit.minus(await this.txFees(maxOutProfit));
        // logger.info(
        //     "maxInProfit minus fees: ",
        //     maxInProfit.toFixed(this.tokenIn.decimals),
        //     this.tokenOut.symbol,
        // );
        // logger.info(
        //     "maxOutProfit minus fees: ",
        //     maxOutProfit.toFixed(this.tokenIn.decimals),
        //     this.tokenOut.symbol,
        // );
        let potentialProfit = maxInProfit.gt(maxOutProfit) ? maxInProfit : maxOutProfit;
        let tradeSize = maxInProfit.gt(maxOutProfit) ? maxToken0In : maxToken0Out;
        // logger.info(
        //     "Max tradeSize: ",
        //     tradeSize.toFixed(this.tokenIn.decimals),
        //     " potential Profit: ",
        //     potentialProfit.toFixed(this.tokenOut.decimals),
        // );
        return tradeSize;
    }

    async getSize(): Promise<bigint> {
        let rawSize = await this.calcMostProfitable();
        let size: bigint = 0n;
        if (rawSize.gt(BN(0))) {
            logger.info("rawSize: ", rawSize.toFixed(this.tokenIn.decimals));

            size = pu(rawSize.toFixed(this.tokenIn.decimals), this.tokenIn.decimals);
            size = size < this.low.reserves.reserveIn ? size : this.low.reserves.reserveIn;
            // logger.info(
            //     "size: bigint: ",
            //     size,
            //     fu(size, this.tokenIn.decimals),
            //     " in ",
            //     this.tokenIn.symbol,
            // );
            // const toPrice = await this.tradeToPrice();
            // use maxIn, maxOut to make sure the trade doesn't revert due to too much slippage on target
            // const maxIn = await this.getMaxTokenIn();
            // const bestSize = toPrice < maxIn ? toPrice : maxIn;

            //473 * 800 / 1000 = 378.4
            // const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            // const msg = size.eq(safeReserves) ? "[getSize]: using safeReserves" : "[getSize]: using bestSize";
            // console.log(msg);
        }
        return size;
    }

    async tradeToPrice(): Promise<bigint> {
        // this.targetPrice = this.price.priceOutBN.plus(this.targetPrice).div(2);// average of two prices
        if (this.high.priceOutBN.gt(this.low.priceOutBN)) {
            console.log("targetPrice must be greater than loanPoolPrice");
            return 0n;
        }
        const tradeSize = await tradeToPrice(
            this.high.reserves.reserveInBN,
            this.high.reserves.reserveOutBN,
            this.low.priceOutBN,
            this.slip,
        );
        // console.log('tradeSize: ', tradeSize.toFixed(this.tokenIn.decimals));//DEBUG
        const tradeSizeJS = pu(tradeSize.toFixed(this.tokenIn.decimals), this.tokenIn.decimals);
        // console.log('tradeSizeJS: ', fu(tradeSizeJS, this.tokenIn.decimals));//DEBUG
        return tradeSizeJS;
    }

    async subSlippage(amountOut: bigint, decimals: number): Promise<bigint> {
        const amount = BigInt2BN(amountOut, decimals);
        const slippage = amount.times(this.slip);
        const adjAmountBN = amount.minus(slippage);
        const adjAmountJS = pu(adjAmountBN.toFixed(decimals), decimals);
        // 12000 * 0.005 = 60
        // 12000 - 60 = 11940
        //
        return adjAmountJS;
    }

    // Adds Uniswap V2 trade fee to any amount
    async addFee(amount: bigint): Promise<bigint> {
        //ALTERNATVE:

        // const repay = amount.mul(1003009027).div(1000000000);
        const repay = (amount * 1003n) / 1000n; // 0.3% fee (997/1000)
        // 167 * 1003 / 1000 =
        //167 * 997 / 1000 = 166
        // ex 100000 * 1003009027 / 1000000000 = 100301
        return repay; //in tokenIn
    }
}
