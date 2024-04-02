import { BigNumber as BN } from "bignumber.js";
import { getMaxIn, getMaxOut, tradeToPrice } from "../modules/tradeMath";
import {
    BoolTrade,
    Pair,
    ReservesData,
    Sizes,
    TradePair,
} from "../../../constants/interfaces";
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
    trade: BoolTrade;
    tradeSizes: Sizes;

    constructor(trade: BoolTrade) {
        this.tradeSizes = {
            loanPool: {
                tradeSizeTokenIn: { size: 0n },
                // tradeSizeTokenIn: { size: 0n, sizeBN: BN(0) },
            },
            target: {
                tradeSizeTokenOut: { size: 0n },
                // tradeSizeTokenOut: { size: 0n, sizeBN: BN(0) },
            },
        };
        this.trade = trade;
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
                tradeSizeTokenIn: { size: 0n },
                // tradeSizeTokenIn: { size: 0n, sizeBN: BN(0) },
            },
            target: {
                tradeSizeTokenOut: { size: 0n },
                // tradeSizeTokenOut: { size: 0n, sizeBN: BN(0) },
            },
        };

        const tradeSizeTokenIn = await tradeToPrice(
            this.trade.target.reserveInBN,
            this.trade.target.reserveOutBN,
            this.trade.target.priceOut,
            slip,
        );
        // Can only trade into token0Price on loanPool if trading to token1 on target (as prices are correlated)
        const tradeSizeTokenOut = await tradeToPrice(
            this.trade.loanPool.reserveOutBN,
            this.trade.loanPool.reserveInBN,
            this.trade.target.priceIn,
            slip,
        );

        // console.log(
        //     "tradeSizeTokenIn: ",
        //     tradeSizeTokenIn.toFixed(this.trade.tokenIn.data.decimals),
        //     "tradeSizeTokenOut: ",
        //     tradeSizeTokenOut.toFixed(this.trade.tokenOut.data.decimals),
        // ); //DEBUG

        const tradeSizeInJS = pu(
            tradeSizeTokenIn.toFixed(this.trade.tokenIn.data.decimals),
            this.trade.tokenIn.data.decimals,
        );
        const tradeSizeOutJS = pu(
            tradeSizeTokenOut.toFixed(this.trade.tokenOut.data.decimals),
            this.trade.tokenOut.data.decimals,
        );
        // console.log("tradeSizeJS: ", fu(tradeSizeJS, this.trade.tokenIn.data.decimals)); //DEBUG
        tradeSizes = {
            loanPool: {
                tradeSizeTokenIn: {
                    size: tradeSizeInJS,
                    // sizeBN: tradeSizeTokenIn,
                },
            },
            target: {
                tradeSizeTokenOut: {
                    size: tradeSizeOutJS,
                    // sizeBN: tradeSizeTokenOut,
                },
            },
        };
        return tradeSizes;
    }

    async getMaxTokenInIOtarget(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.trade.target.reserveInBN, slip);
        const maxOutBN = await getMaxOut(this.trade.target.reserveInBN, slip);
        const maxIn = pu(
            maxInBN.toFixed(this.trade.tokenIn.data.decimals),
            this.trade.tokenIn.data.decimals!,
        );
        const maxOut = pu(
            maxOutBN.toFixed(this.trade.tokenIn.data.decimals),
            this.trade.tokenIn.data.decimals!,
        );
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxTokenOutIOtarget(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.trade.target.reserveOutBN, slip);
        const maxOutBN = await getMaxOut(this.trade.target.reserveOutBN, slip);
        const maxIn = pu(
            maxInBN.toFixed(this.trade.tokenOut.data.decimals),
            this.trade.tokenOut.data.decimals!,
        );
        const maxOut = pu(
            maxOutBN.toFixed(this.trade.tokenOut.data.decimals),
            this.trade.tokenOut.data.decimals!,
        );
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async getMaxTokenInIOloanPool(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.trade.loanPool.reserveInBN, slip);
        const maxOutBN = await getMaxOut(this.trade.loanPool.reserveInBN, slip);
        const maxIn = pu(
            maxInBN.toFixed(this.trade.tokenIn.data.decimals),
            this.trade.tokenIn.data.decimals!,
        );
        const maxOut = pu(
            maxOutBN.toFixed(this.trade.tokenIn.data.decimals),
            this.trade.tokenIn.data.decimals!,
        );
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }
    async getMaxTokenOutIOloanPool(): Promise<{
        maxIn: bigint;
        maxInBN: BN;
        maxOut: bigint;
        maxOutBN: BN;
    }> {
        const maxInBN = await getMaxIn(this.trade.loanPool.reserveOutBN, slip);
        const maxOutBN = await getMaxOut(this.trade.loanPool.reserveInBN, slip);
        const maxIn = pu(
            maxInBN.toFixed(this.trade.tokenOut.data.decimals),
            this.trade.tokenOut.data.decimals!,
        );
        const maxOut = pu(
            maxOutBN.toFixed(this.trade.tokenOut.data.decimals),
            this.trade.tokenOut.data.decimals!,
        );
        return { maxIn, maxInBN, maxOut, maxOutBN };
    }

    async subSlippage(amountOut: bigint, decimals: number): Promise<bigint> {
        const amount = BigInt2BN(amountOut, decimals);
        const slippage = amount.times(slip);
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

        const sizetargetTokenOut = async (): Promise<bigint> => {
            const toPrice1 = p.target.tradeSizeTokenOut.size;
            if (toPrice1 === 1n) {
                return 1n;
            }
            // use max1Intarget to make sure the trade doesn't revert due to too much slippage on target
            let max1Intarget = (await this.getMaxTokenOutIOtarget()).maxIn;
            // use max1OutloanPool to ensure trade doesn't revert due to insufficient liq on loanPool
            let max1OutloanPool = (await this.getMaxTokenOutIOloanPool())
                .maxOut;

            max1OutloanPool =
                max1OutloanPool < 1n ? max1OutloanPool * -1n : max1OutloanPool;

            let bestSize: bigint = toPrice1;

            if (toPrice1 > max1Intarget) {
                bestSize = max1Intarget;
            }
            if (toPrice1 > max1OutloanPool) {
                bestSize = max1OutloanPool;
            }

            const safeReserves = (this.trade.target.reserveOut * 820n) / 1000n;
            const size =
                bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        // const size1BN = async (): Promise<BN> => {
        //     const toPrice1 = p.target.tradeSizeTokenOut.sizeBN;
        //     if (toPrice1.eq(BN(1))) {
        //         return BN(1);
        //     }
        //     let max1Intarget = (await this.getMaxTokenOutIOtarget()).maxInBN;
        //     let max1OutloanPool = (await this.getMaxTokenOutIOloanPool())
        //         .maxOutBN;

        //     max1OutloanPool.abs();
        //     let bestSize: BN = toPrice1;
        //     if (toPrice1.gt(max1Intarget)) {
        //         bestSize = max1Intarget;
        //     }
        //     if (toPrice1.gt(max1OutloanPool)) {
        //         bestSize = max1OutloanPool;
        //     }
        //     const safeReserves = this.trade.target.reserveInBN
        //         .times(820)
        //         .div(1000);
        //     const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
        //     // console.log("sizeBN: ", size.toFixed(this.trade.tokenIn.data.decimals), this.tokenIn.symbol); //DEBUG

        //     return size;
        // };

        const sizeloanPoolTokenIn = async (): Promise<bigint> => {
            const toPrice0 = p.loanPool.tradeSizeTokenIn.size;
            if (toPrice0 === 0n) {
                return 0n;
            }
            // use max0Intarget to make sure the trade doesn't revert due to too much slippage on target
            let max0Intarget = (await this.getMaxTokenInIOtarget()).maxIn;
            // use max0OutloanPool to ensure trade doesn't revert due to insufficient liq on loanPool
            let max0OutloanPool = (await this.getMaxTokenInIOloanPool()).maxOut;

            max0OutloanPool =
                max0OutloanPool < 0n ? max0OutloanPool * -1n : max0OutloanPool;

            let bestSize: bigint = toPrice0;

            if (toPrice0 > max0Intarget) {
                bestSize = max0Intarget;
            }
            if (toPrice0 > max0OutloanPool) {
                bestSize = max0OutloanPool;
            }

            const safeReserves = (this.trade.loanPool.reserveIn * 820n) / 1000n;
            const size =
                bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            return size;
        };

        // const size0BN = async (): Promise<BN> => {
        //     const toPrice0 = p.loanPool.tradeSizeTokenIn.sizeBN;
        //     if (toPrice0.eq(BN(0))) {
        //         return BN(0);
        //     }
        //     let max0Intarget = (await this.getMaxTokenInIOtarget()).maxInBN;
        //     let max0OutloanPool = (await this.getMaxTokenInIOloanPool())
        //         .maxOutBN;

        //     max0OutloanPool.abs();
        //     let bestSize: BN = toPrice0;
        //     if (toPrice0.gt(max0Intarget)) {
        //         bestSize = max0Intarget;
        //     }
        //     if (toPrice0.gt(max0OutloanPool)) {
        //         bestSize = max0OutloanPool;
        //     }
        //     const safeReserves = this.trade.target.reserveInBN
        //         .times(820)
        //         .div(1000);
        //     const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
        //     // console.log("sizeBN: ", size.toFixed(this.trade.tokenIn.data.decimals), this.tokenIn.symbol); //DEBUG

        //     return size;
        // };

        p = {
            loanPool: {
                tradeSizeTokenIn: {
                    size: await sizeloanPoolTokenIn(),
                    // sizeBN: await size0BN(),
                },
            },
            target: {
                tradeSizeTokenOut: {
                    size: await sizetargetTokenOut(),
                    // sizeBN: await size1BN(),
                },
            },
        };

        const tradeSizes = {
            loanPool: {
                tradeSizeTokenIn:
                    fu(
                        p.loanPool.tradeSizeTokenIn.size,
                        this.trade.tokenIn.data.decimals,
                    ) +
                    " " +
                    this.trade.tokenIn.data.symbol,
            },
            target: {
                tradeSizeTokenOut:
                    fu(
                        p.target.tradeSizeTokenOut.size,
                        this.trade.tokenOut.data.decimals,
                    ) +
                    " " +
                    this.trade.tokenOut.data.symbol,
            },
        };

        // console.log("[AmountConverter]: ", tradeSizes);
        return p;
    }
}
