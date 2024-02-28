import { BigNumber as BN } from "bignumber.js";
import { getMaxTokenIn, getMaxTokenOut, tradeToPrice } from "../modules/tradeMath";
import { Pair, ReservesData, TradePair } from "../../../constants/interfaces";
import { Prices } from "./Prices";
import { Token, Amounts } from "../../../constants/interfaces";
import { BigInt2BN, fu, pu } from "../../modules/convertBN";
import { slip } from "../../../constants/environment";

/**
 * @description
 * This class holds amounts in/out for a pair, as well as the trade size.
 * Target priceTarget is re-intitialized as the average of two priceTargets.
 */
export class AmountConverter {
    tokenIn: Token;
    tokenOut: Token;
    reservesLoanPool: ReservesData;
    reservesTarget: ReservesData;
    priceLoanPool: Prices;
    priceTarget: Prices;
    targetPrice: BN;
    slip: BN;

    constructor(priceLoanPool: Prices, priceTarget: Prices, pair: TradePair, targetPrice: BN) {
        this.reservesLoanPool = priceLoanPool.reserves;
        this.reservesTarget = priceTarget.reserves;
        this.priceLoanPool = priceLoanPool;
        this.priceTarget = priceTarget;
        this.targetPrice = targetPrice;
        this.slip = slip;
        // DETERMINE DIRECTION OF TRADE HERE TOKEN0 -> TOKEN1 OR TOKEN1 -> TOKEN0
        this.tokenIn = pair.token1; // direction tokenIn-tokenOut reults in WMATIC pairs more often, making pricing easier.
        this.tokenOut = pair.token0;
    }

    /**
     * @returns Amounts in/out for a trade. Should never be negative.
     */
    // tradeToPrice gets a mid-level between priceTarget of pool and target priceTarget, and returns the amount of tokenIn needed to reach that priceTarget
    // can be limited by slip if uniswap returns 'EXCESSIVE_INPUT_AMOUNT'
    // can be limited by maxIn if uniswap returns 'INSUFFICIENT_INPUT_AMOUNT'

    async getSize(): Promise<{
        size: bigint;
        sizeBN: BN;
    }> {
        const p = await this.tradeToPrice();
        const size = async (): Promise<bigint> => {
            const toPrice = p.tradeSize;
            if (toPrice === 0n) {
                return 0n;
            }
            // use maxIn to make sure the trade doesn't revert due to too much slippage on target
            let maxIn = await this.getMaxTokenIn();
            // use maxOut to ensure trade doesn't revert due to insufficient liq on loanPool
            let maxOut = pu(
                (await getMaxTokenOut(this.reservesLoanPool.reserveInBN, this.slip)).toFixed(
                    this.tokenIn.decimals,
                ),
                this.tokenIn.decimals,
            );
            maxOut = maxOut < 0n ? maxOut * -1n : maxOut;
            let bestSize: bigint = toPrice;
            if (toPrice > maxIn) {
                bestSize = maxIn;
            }
            if (toPrice > maxOut) {
                bestSize = maxOut;
            }

            //toPrice > maxIn ? maxIn : toPrice;

            const safeReserves = (this.reservesTarget.reserveIn * 820n) / 1000n;
            const size = bestSize > BigInt(safeReserves) ? safeReserves : bestSize;
            // console.log("size: ", fu(size, this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG
            return size;
        };
        const sizeBN = async (): Promise<BN> => {
            const toPrice = p.tradeSizeBN;
            if (toPrice.eq(BN(0))) {
                return BN(0);
            }
            let maxIn = await getMaxTokenIn(this.reservesTarget.reserveInBN, this.slip);
            let maxOut = await getMaxTokenOut(this.reservesLoanPool.reserveInBN, this.slip);
            maxOut.abs();
            let bestSize: BN = toPrice;
            if (toPrice.gt(maxIn)) {
                bestSize = maxIn;
            }
            if (toPrice.gt(maxOut)) {
                bestSize = maxOut;
            }
            const safeReserves = this.reservesTarget.reserveInBN.times(820).div(1000);
            const size = bestSize.gt(safeReserves) ? safeReserves : bestSize;
            // console.log("sizeBN: ", size.toFixed(this.tokenIn.decimals), this.tokenIn.symbol); //DEBUG

            return size;
        };
        return { size: await size(), sizeBN: await sizeBN() };
    }
    async tradeToPrice(): Promise<{ tradeSize: bigint; tradeSizeBN: BN }> {
        // this.targetPrice = this.priceTarget.priceTargetOutBN.plus(this.targetPrice).div(2);// average of two priceTargets
        // console.log({
        // 	reservesTargetInBN: this.reservesTarget.reserveInBN.toString(),
        // 	reserveOutBN: this.reservesTarget.reserveOutBN.toString(),
        // 	targetPrice:  this.targetPrice,
        // 	slip: this.slip})
        const tradeSize = await tradeToPrice(
            this.reservesTarget.reserveInBN,
            this.reservesTarget.reserveOutBN,
            this.targetPrice,
            this.slip,
        );
        // console.log("tradeSize: ", tradeSize.toFixed(this.tokenIn.decimals)); //DEBUG
        const tradeSizeJS = pu(tradeSize.toFixed(this.tokenIn.decimals), this.tokenIn.decimals);
        // console.log("tradeSizeJS: ", fu(tradeSizeJS, this.tokenIn.decimals)); //DEBUG
        return { tradeSize: tradeSizeJS, tradeSizeBN: tradeSize };
    }

    async getMaxTokenIn(): Promise<bigint> {
        const maxTokenIn = await getMaxTokenIn(this.reservesTarget.reserveInBN, this.slip);
        // console.log('maxTokenIn: ', maxTokenIn.toFixed(this.tokenIn.decimals));//DEBUG
        const maxIn = pu(maxTokenIn.toFixed(this.tokenIn.decimals), this.tokenIn.decimals!);
        return maxIn;
    }

    async getMaxTokenOut(): Promise<bigint> {
        const maxTokenOut = await getMaxTokenOut(this.reservesTarget.reserveOutBN, this.slip);
        const maxOut = pu(maxTokenOut.toFixed(this.tokenOut.decimals), this.tokenOut.decimals!);
        return maxOut;
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
