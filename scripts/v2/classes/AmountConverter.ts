import { BigNumber as BN } from "bignumber.js";
import { getMaxIn, getMaxOut, tradeToPrice } from "../modules/tradeMath";
import { Pair, ReservesData, Sizes, TradePair } from "../../../constants/interfaces";
import { Prices } from "./Prices";
import { Token, Amounts } from "../../../constants/interfaces";
import { BigInt2BN, fu, pu } from "../../modules/convertBN";
import { slip } from "../../../constants/environment";

/**
 * @description
 * This class holds amounts in/out for a pair, as well as the trade size.
 * pool1 pricespool1 is re-intitialized as the average of two pricespool1s.
 */

export class AmountConverter {
    tokenIn: Token;
    tokenOut: Token;
    reservespool0: ReservesData;
    reservespool1: ReservesData;
    pricespool0: Prices;
    pricespool1: Prices;
    pool1PriceToken0: BN;
    pool1PriceToken1: BN;
    slip: BN;
    tradeSizes: Sizes;

    constructor(pricespool0: Prices, pricespool1: Prices, pair: TradePair) {
        this.reservespool0 = pricespool0.reserves;
        this.reservespool1 = pricespool1.reserves;
        this.pricespool0 = pricespool0;
        this.pricespool1 = pricespool1;
        this.pool1PriceToken0 = pricespool1.priceInBN; //.plus(pricespool0.priceInBN).div(2);
        this.pool1PriceToken1 = pricespool0.priceOutBN; //.plus(pricespool1.priceOutBN).div(2);
        this.slip = slip;
        this.tradeSizes = {
            pool0: {
                token0: { size: 0n, sizeBN: BN(0) },
            },
            pool1: {
                token1: { size: 0n, sizeBN: BN(0) },
            },
        };
        // }; // DETERMINE DIRECTION OF TRADE HERE TOKEN0 -> TOKEN1 OR TOKEN1 -> TOKEN0
        this.tokenIn = pair.token1; // direction tokenIn-tokenOut reults in WMATIC pairs more often, making pricing easier.
        this.tokenOut = pair.token0;
    }

    /**
     * @returns Amounts in/out for a trade. Should never be negative.
     */
    // tradeToPrice gets a mid-level between pricespool1 of pool and pool1 pricespool1, and returns the amount of tokenIn needed to reach that pricespool1
    // can be limited by slip if uniswap returns 'EXCESSIVE_INPUT_AMOUNT'
    // can be limited by max0Inpool1 if uniswap returns 'INSUFFICIENT_INPUT_AMOUNT'

    async tradeToPrice(): Promise<Sizes> {
        let tradeSizes: Sizes = {
            pool0: {
                token0: { size: 0n, sizeBN: BN(0) },
            },
            pool1: {
                token1: { size: 0n, sizeBN: BN(0) },
            },
        };

        const tradeSizeToken0 = await tradeToPrice(
            this.reservespool1.reserveInBN,
            this.reservespool1.reserveOutBN,
            this.pool1PriceToken1,
            this.slip,
        );
        // Can only trade into token0Price on pool0 if trading to token1 on pool1 (as prices are correlated)
        const tradeSizeToken1 = await tradeToPrice(
            this.reservespool0.reserveOutBN,
            this.reservespool0.reserveInBN,
            this.pool1PriceToken0,
            this.slip,
        );
        // console.log("tradeSize: ", tradeSize.toFixed(this.tokenIn.decimals)); //DEBUG
        const tradeSize0JS = pu(
            tradeSizeToken0.toFixed(this.tokenIn.decimals),
            this.tokenIn.decimals,
        );
        const tradeSize1JS = pu(
            tradeSizeToken1.toFixed(this.tokenIn.decimals),
            this.tokenIn.decimals,
        );
        // console.log("tradeSizeJS: ", fu(tradeSizeJS, this.tokenIn.decimals)); //DEBUG
        tradeSizes = {
            pool0: {
                token0: { size: tradeSize0JS, sizeBN: tradeSizeToken0 },
            },
            pool1: {
                token1: { size: tradeSize1JS, sizeBN: tradeSizeToken1 },
            },
        };
        return tradeSizes;
    }

    async getMaxToken0IOpool1(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservespool1.reserveInBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservespool1.reserveInBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxToken1IOpool1(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservespool1.reserveOutBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservespool1.reserveOutBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxToken0IOpool0(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservespool0.reserveInBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservespool0.reserveInBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }
    async getMaxToken1IOpool0(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservespool0.reserveOutBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservespool0.reserveInBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
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

    async getSize(): Promise<Sizes> {
        let p = await this.tradeToPrice();

        const size1 = async (): Promise<bigint> => {
            const toPrice1 = p.pool1.token1.size;
            if (toPrice1 === 1n) {
                return 1n;
            }
            // use max1Inpool1 to make sure the trade doesn't revert due to too much slippage on pool1
            let max1Inpool1 = (await this.getMaxToken1IOpool1()).maxIn;
            // use max1Outpool0 to ensure trade doesn't revert due to insufficient liq on pool0
            let max1Outpool0 = (await this.getMaxToken1IOpool0()).maxOut;

            max1Outpool0 = max1Outpool0 < 1n ? max1Outpool0 * -1n : max1Outpool0;

            let bestSize: bigint = toPrice1;

            if (toPrice1 > max1Inpool1) {
                bestSize = max1Inpool1;
            }
            if (toPrice1 > max1Outpool0) {
                bestSize = max1Outpool0;
            }

            const safeReserves = (this.reservespool1.reserveIn * 820n) / 1000n;
            const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        const size1BN = async (): Promise<BN> => {
            const toPrice1 = p.pool1.token1.sizeBN;
            if (toPrice1.eq(BN(1))) {
                return BN(1);
            }
            let max1Inpool1 = (await this.getMaxToken1IOpool1()).maxInBN;
            let max1Outpool0 = (await this.getMaxToken1IOpool0()).maxOutBN;

            max1Outpool0.abs();
            let bestSize: BN = toPrice1;
            if (toPrice1.gt(max1Inpool1)) {
                bestSize = max1Inpool1;
            }
            if (toPrice1.gt(max1Outpool0)) {
                bestSize = max1Outpool0;
            }
            const safeReserves = this.reservespool1.reserveInBN.times(820).div(1000);
            const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
            // console.log("sizeBN: ", size.toFixed(this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG

            return size;
        };

        const size0 = async (): Promise<bigint> => {
            const toPrice0 = p.pool0.token0.size;
            if (toPrice0 === 0n) {
                return 0n;
            }
            // use max0Inpool1 to make sure the trade doesn't revert due to too much slippage on pool1
            let max0Inpool1 = (await this.getMaxToken0IOpool1()).maxIn;
            // use max0Outpool0 to ensure trade doesn't revert due to insufficient liq on pool0
            let max0Outpool0 = (await this.getMaxToken0IOpool0()).maxOut;

            max0Outpool0 = max0Outpool0 < 0n ? max0Outpool0 * -1n : max0Outpool0;

            let bestSize: bigint = toPrice0;

            if (toPrice0 > max0Inpool1) {
                bestSize = max0Inpool1;
            }
            if (toPrice0 > max0Outpool0) {
                bestSize = max0Outpool0;
            }

            const safeReserves = (this.reservespool1.reserveIn * 820n) / 1000n;
            const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        const size0BN = async (): Promise<BN> => {
            const toPrice0 = p.pool0.token0.sizeBN;
            if (toPrice0.eq(BN(0))) {
                return BN(0);
            }
            let max0Inpool1 = (await this.getMaxToken0IOpool1()).maxInBN;
            let max0Outpool0 = (await this.getMaxToken0IOpool0()).maxOutBN;

            max0Outpool0.abs();
            let bestSize: BN = toPrice0;
            if (toPrice0.gt(max0Inpool1)) {
                bestSize = max0Inpool1;
            }
            if (toPrice0.gt(max0Outpool0)) {
                bestSize = max0Outpool0;
            }
            const safeReserves = this.reservespool1.reserveInBN.times(820).div(1000);
            const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
            // console.log("sizeBN: ", size.toFixed(this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG

            return size;
        };

        p = {
            pool0: {
                token0: { size: await size0(), sizeBN: await size0BN() },
            },
            pool1: {
                token1: { size: await size1(), sizeBN: await size1BN() },
            },
        };

        return p;
    }
}
