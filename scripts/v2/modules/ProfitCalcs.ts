import { BigNumber as BN } from "bignumber.js";
import { BoolTrade, Profcalcs, Repays } from "../../../constants/interfaces";
import { BigInt2BN, fu } from "../../modules/convertBN";
import { AmountConverter } from "./amountConverter";

export class ProfitCalculator {
    repays: Repays;
    trade: BoolTrade;
    calc: AmountConverter;

    constructor(trade: BoolTrade, calc: AmountConverter, repays: Repays) {
        this.trade = trade;
        this.calc = calc;
        this.repays = repays;
    }

    async getMultiProfit(): Promise<Profcalcs> {
        try {
            let profit: Profcalcs = { profit: 0n, profitPercent: BN(0) };
            profit.profit = this.trade.target.amountOut - this.repays.repay;
            const profitBN = BigInt2BN(profit.profit, this.trade.tokenOut.decimals);
            profit.profitPercent =
                profit.profit > 0n && this.trade.target.amountOut > 0
                    ? profitBN
                          .dividedBy(fu(this.trade.target.amountOut, this.trade.tokenOut.decimals))
                          .multipliedBy(100)
                    : BN(0);
            return profit;
        } catch (error: any) {
            console.log("Error in getMultiProfit: " + error.message);
            return { profit: 0n, profitPercent: BN(0) };
        }
    }

    async getDirectProfit(this: any): Promise<Profcalcs> {
        try {
            const repays = await this.repays.direct(this.calc, this.trade);
            const profit = BigInt(this.trade.target.amountOut - repays.directInTokenOut);
            const profitBN = BigInt2BN(profit, this.trade.tokenOut.decimals);
            const profitPercent =
                profit > 0n && this.trade.target.amountOut > 0
                    ? profitBN
                          .dividedBy(fu(this.trade.target.amountOut, this.trade.tokenOut.decimals))
                          .multipliedBy(100)
                    : BN(0);
            const profCalcs = { profit, profitPercent };
            return profCalcs;
        } catch (error: any) {
            console.log("Error in getDirectProfit: " + error.message);
            return { profit: 0n, profitPercent: BN(0) };
        }
    }
}
