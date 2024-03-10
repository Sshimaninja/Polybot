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
 * target pricestarget is re-intitialized as the average of two pricestargets.
 */

export class AmountConverter {
    tokenIn: Token;
    tokenOut: Token;
    reservesloanPool: ReservesData;
    reservestarget: ReservesData;
    pricesloanPool: Prices;
    pricestarget: Prices;
    targetPriceToken0: BN;
    targetPriceToken1: BN;
    slip: BN;
    tradeSizes: Sizes;

    constructor(pricesloanPool: Prices, pricestarget: Prices, pair: TradePair) {
        this.reservesloanPool = pricesloanPool.reserves;
        this.reservestarget = pricestarget.reserves;
        this.pricesloanPool = pricesloanPool;
        this.pricestarget = pricestarget;
        this.targetPriceToken0 = pricestarget.priceInBN; //.plus(pricesloanPool.priceInBN).div(2);
        this.targetPriceToken1 = pricesloanPool.priceOutBN; //.plus(pricestarget.priceOutBN).div(2);
        this.slip = slip;
        this.tradeSizes = {
            loanPool: {
                tradeSizeTokenIn: { size: 0n, sizeBN: BN(0) },
            },
            target: {
                tradeSizeTokenOut: { size: 0n, sizeBN: BN(0) },
            },
        };
        // }; // DETERMINE DIRECTION OF TRADE HERE TOKEN0 -> TOKEN1 OR TOKEN1 -> TOKEN0
        this.tokenIn = pair.token1; // direction tokenIn-tokenOut reults in WMATIC pairs more often, making pricing easier.
        this.tokenOut = pair.token0;
    }

    /**
     * @returns Amounts in/out for a trade. Should never be negative.
     */
    // tradeToPrice gets a mid-level between pricestarget of pool and target pricestarget, and returns the amount of tokenIn needed to reach that pricestarget
    // can be limited by slip if uniswap returns 'EXCESSIVE_INPUT_AMOUNT'
    // can be limited by max0Intarget if uniswap returns 'INSUFFICIENT_INPUT_AMOUNT'

    async tradeToPrice(): Promise<Sizes> {
        let tradeSizes: Sizes = {
            loanPool: {
                tradeSizeTokenIn: { size: 0n, sizeBN: BN(0) },
            },
            target: {
                tradeSizeTokenOut: { size: 0n, sizeBN: BN(0) },
            },
        };

        const tradeSizeTokenIn = await tradeToPrice(
            this.reservestarget.reserveInBN,
            this.reservestarget.reserveOutBN,
            this.targetPriceToken1,
            this.slip,
        );
        // Can only trade into token0Price on loanPool if trading to token1 on target (as prices are correlated)
        const tradeSizeTokenOut = await tradeToPrice(
            this.reservesloanPool.reserveOutBN,
            this.reservesloanPool.reserveInBN,
            this.targetPriceToken0,
            this.slip,
        );
        // console.log("tradeSize: ", tradeSize.toFixed(this.tokenIn.decimals)); //DEBUG
        const tradeSize0JS = pu(
            tradeSizeTokenIn.toFixed(this.tokenIn.decimals),
            this.tokenIn.decimals,
        );
        const tradeSize1JS = pu(
            tradeSizeTokenOut.toFixed(this.tokenOut.decimals),
            this.tokenOut.decimals,
        );
        // console.log("tradeSizeJS: ", fu(tradeSizeJS, this.tokenIn.decimals)); //DEBUG
        tradeSizes = {
            loanPool: {
                tradeSizeTokenIn: { size: tradeSize0JS, sizeBN: tradeSizeTokenIn },
            },
            target: {
                tradeSizeTokenOut: { size: tradeSize1JS, sizeBN: tradeSizeTokenOut },
            },
        };
        return tradeSizes;
    }

    async getMaxToken0IOtarget(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservestarget.reserveInBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservestarget.reserveInBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxToken1IOtarget(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservestarget.reserveOutBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservestarget.reserveOutBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxToken0IOloanPool(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservesloanPool.reserveInBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservesloanPool.reserveInBN, this.slip);
        const maxIn = pu(maxInBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        const maxOut = pu(maxOutBN.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }
    async getMaxToken1IOloanPool(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.reservesloanPool.reserveOutBN, this.slip);
        const maxOutBN = await getMaxOut(this.reservesloanPool.reserveInBN, this.slip);
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

        const sizetargetToken1 = async (): Promise<bigint> => {
            const toPrice1 = p.target.tradeSizeTokenOut.size;
            if (toPrice1 === 1n) {
                return 1n;
            }
            // use max1Intarget to make sure the trade doesn't revert due to too much slippage on target
            let max1Intarget = (await this.getMaxToken1IOtarget()).maxIn;
            // use max1OutloanPool to ensure trade doesn't revert due to insufficient liq on loanPool
            let max1OutloanPool = (await this.getMaxToken1IOloanPool()).maxOut;

            max1OutloanPool = max1OutloanPool < 1n ? max1OutloanPool * -1n : max1OutloanPool;

            let bestSize: bigint = toPrice1;

            if (toPrice1 > max1Intarget) {
                bestSize = max1Intarget;
            }
            if (toPrice1 > max1OutloanPool) {
                bestSize = max1OutloanPool;
            }

            const safeReserves = (this.reservestarget.reserveOut * 820n) / 1000n;
            const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        const size1BN = async (): Promise<BN> => {
            const toPrice1 = p.target.tradeSizeTokenOut.sizeBN;
            if (toPrice1.eq(BN(1))) {
                return BN(1);
            }
            let max1Intarget = (await this.getMaxToken1IOtarget()).maxInBN;
            let max1OutloanPool = (await this.getMaxToken1IOloanPool()).maxOutBN;

            max1OutloanPool.abs();
            let bestSize: BN = toPrice1;
            if (toPrice1.gt(max1Intarget)) {
                bestSize = max1Intarget;
            }
            if (toPrice1.gt(max1OutloanPool)) {
                bestSize = max1OutloanPool;
            }
            const safeReserves = this.reservestarget.reserveInBN.times(820).div(1000);
            const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
            // console.log("sizeBN: ", size.toFixed(this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG

            return size;
        };

        const sizeloanPoolToken0 = async (): Promise<bigint> => {
            const toPrice0 = p.loanPool.tradeSizeTokenIn.size;
            if (toPrice0 === 0n) {
                return 0n;
            }
            // use max0Intarget to make sure the trade doesn't revert due to too much slippage on target
            let max0Intarget = (await this.getMaxToken0IOtarget()).maxIn;
            // use max0OutloanPool to ensure trade doesn't revert due to insufficient liq on loanPool
            let max0OutloanPool = (await this.getMaxToken0IOloanPool()).maxOut;

            max0OutloanPool = max0OutloanPool < 0n ? max0OutloanPool * -1n : max0OutloanPool;

            let bestSize: bigint = toPrice0;

            if (toPrice0 > max0Intarget) {
                bestSize = max0Intarget;
            }
            if (toPrice0 > max0OutloanPool) {
                bestSize = max0OutloanPool;
            }

            const safeReserves = (this.reservesloanPool.reserveIn * 820n) / 1000n;
            const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        const size0BN = async (): Promise<BN> => {
            const toPrice0 = p.loanPool.tradeSizeTokenIn.sizeBN;
            if (toPrice0.eq(BN(0))) {
                return BN(0);
            }
            let max0Intarget = (await this.getMaxToken0IOtarget()).maxInBN;
            let max0OutloanPool = (await this.getMaxToken0IOloanPool()).maxOutBN;

            max0OutloanPool.abs();
            let bestSize: BN = toPrice0;
            if (toPrice0.gt(max0Intarget)) {
                bestSize = max0Intarget;
            }
            if (toPrice0.gt(max0OutloanPool)) {
                bestSize = max0OutloanPool;
            }
            const safeReserves = this.reservestarget.reserveInBN.times(820).div(1000);
            const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
            // console.log("sizeBN: ", size.toFixed(this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG

            return size;
        };

        p = {
            loanPool: {
                tradeSizeTokenIn: { size: await sizeloanPoolToken0(), sizeBN: await size0BN() },
            },
            target: {
                tradeSizeTokenOut: { size: await sizetargetToken1(), sizeBN: await size1BN() },
            },
        };

        const tradeSizes = {
            loanPool: {
                tradeSizeTokenIn:
                    fu(p.loanPool.tradeSizeTokenIn.size, this.tokenIn.decimals) +
                    " " +
                    this.tokenIn.symbol,
            },
            target: {
                tradeSizeTokenOut:
                    fu(p.target.tradeSizeTokenOut.size, this.tokenOut.decimals) +
                    " " +
                    this.tokenOut.symbol,
            },
        };

        // console.log("[AmountConverter]: ", tradeSizes);
        return p;
    }
}
