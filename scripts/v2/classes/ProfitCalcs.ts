import { BigNumber as BN } from "bignumber.js";
import { BoolTrade, Profcalcs, Repays } from "../../../constants/interfaces";
import { BigInt2BN, fu } from "../../modules/convertBN";
import { AmountConverter } from "./AmountConverter";

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
            let profit: Profcalcs = { profit: 0n, flashProfit: 0n };
            profit.flashProfit =
                this.trade.quotes.target.token1 > this.repays.flashMulti
                    ? this.trade.quotes.target.token1 - this.repays.flashMulti
                    : 0n;
            const profitBN = BigInt2BN(profit.flashProfit, this.trade.tokenOut.decimals);

            return profit;
        } catch (error: any) {
            console.log("Error in getMultiProfit: " + error.message);
            return { profit: 0n, flashProfit: 0n };
        }
    }

    async getSingleProfit(): Promise<Profcalcs> {
        try {
            const repays = this.repays;

            // Single profit has 2 calculations: one for lfash loan and another for straight arb without flash, as you would usually want to sell back into stake.
            const profit = this.trade.wallet.tokenInBalance - this.trade.quotes.loanPool.in; // This actually gets traded back into tokenIn, but for now we're representing it as tokenOut until I add the switch in the logs.

            const flashProfit =
                this.trade.quotes.target.token1 > repays.flashSingle
                    ? this.trade.quotes.target.token1 - repays.flashSingle
                    : 0n;
            const profCalcs = { profit, flashProfit };
            return profCalcs;
        } catch (error: any) {
            console.log("Error in getSingleProfit: " + error.trace);
            console.log(error);
            return { profit: 0n, flashProfit: 0n };
        }
    }
}
