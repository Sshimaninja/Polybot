import { BigNumber as BN } from "bignumber.js";
import { getMaxTokenIn, getMaxTokenOut, tradeToPrice } from "./tradeMath";
import { Pair, ReservesData, TradePair } from "../../../constants/interfaces";
import { Prices } from "./prices";
import { getGasData } from "./getPolygonGasPrices";
import { Token, Amounts } from "../../../constants/interfaces";
import { getAmountsOut, getAmountsIn } from "./getAmountsIOLocal";
import { HiLo, Difference } from "../../../constants/interfaces";
import { BigInt2BN, fu, pu } from "../../modules/convertBN";
import { slippageTolerance } from "../../v2/control";

/**
 * @description
 * This class holds amounts in/out for a pair, as well as the trade size.
 * Target price is re-intitialized as the average of two prices.
 */
export class AmountConverter {
    token0: Token;
    token1: Token;
    loanPoolReserves: Prices;
    targetReserves: Prices;
    slip: BN;

    constructor(loanPoolReserves: Prices, targetReserves: Prices, pair: TradePair) {
        this.loanPoolReserves = loanPoolReserves;
        this.targetReserves = targetReserves;
        this.slip = slippageTolerance;
        this.token0 = pair.token0;
        this.token1 = pair.token1;
    }

    /**
     * @returns Amounts in/out for a trade. Should never be negative.
     */
    // tradeToPrice gets a mid-level between price of pool and target price, and returns the amount of token0 needed to reach that price
    // can be limited by slippageTolerance if uniswap returns 'EXCESSIVE_INPUT_AMOUNT'
    // can be limited by maxIn if uniswap returns 'INSUFFICIENT_INPUT_AMOUNT'

    async calculateMostProfitableTrade(): Promise<bigint> {
        // Calculate the current prices in both pools
        // const targetPoolPrice = targetReserveOut.div(targetReserveIn);
        // const loanPoolPrice = loanPoolReserveOut.div(loanPoolReserveIn);

        // Calculate the price difference
        const priceDifference = this.targetReserves.priceOutBN.minus(
            this.loanPoolReserves.priceOutBN,
        );

        // Calculate the maximum trade size in the target pool
        const maxTradeSizeTarget = await getMaxTokenIn(
            this.targetReserves.reserves.reserveInBN,
            slippageTolerance,
        );

        // Calculate the maximum trade size in the loan pool
        const maxTradeSizeLoan = await getMaxTokenOut(
            this.loanPoolReserves.reserves.reserveOutBN,
            slippageTolerance,
        );

        // Calculate the potential profit for each trade size
        const profitTarget = maxTradeSizeTarget.multipliedBy(priceDifference).minus(transactionFee);
        const profitLoan = maxTradeSizeLoan.multipliedBy(priceDifference).minus(transactionFee);

        // Choose the trade size that gives the highest profit
        if (profitTarget.gt(profitLoan)) {
            return maxTradeSizeTarget;
        } else {
            return maxTradeSizeLoan;
        }
    }

    async tradeToPrice(): Promise<bigint> {
        // this.targetPrice = this.price.priceOutBN.plus(this.targetPrice).div(2);// average of two prices
        // console.log({
        // 	reservesInBN:this.targetReserves.reserveInBN.toString(),
        // 	reserveOutBN:this.targetReserves.reserveOutBN.toString(),
        // 	targetPrice:  this.targetPrice,
        // 	slip: this.slip})
        const tradeSize = await tradeToPrice(
            this.targetReserves.reserves.reserveInBN,
            this.targetReserves.reserves.reserveOutBN,
            this.loanPoolReserves.priceOutBN,
            this.slip,
        );
        // console.log('tradeSize: ', tradeSize.toFixed(this.token0.decimals));//DEBUG
        const tradeSizeJS = pu(tradeSize.toFixed(this.token0.decimals), this.token0.decimals);
        // console.log('tradeSizeJS: ', fu(tradeSizeJS, this.token0.decimals));//DEBUG
        return tradeSizeJS;
    }

    async getMaxTokenIn(): Promise<bigint> {
        const maxTokenIn = await getMaxTokenIn(this.targetReserves.reserves.reserveInBN, this.slip);
        // console.log('maxTokenIn: ', maxTokenIn.toFixed(this.token0.decimals));//DEBUG
        const maxIn = pu(maxTokenIn.toFixed(this.token0.decimals), this.token0.decimals!);
        return maxIn;
    }

    async getMaxTokenOut(): Promise<bigint> {
        const maxTokenOut = await getMaxTokenOut(
            this.targetReserves.reserves.reserveOutBN,
            this.slip,
        );
        const maxOut = pu(maxTokenOut.toFixed(this.token1.decimals), this.token1.decimals!);
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
        return repay; //in token0
    }
}
