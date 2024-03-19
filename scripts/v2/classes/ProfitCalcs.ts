import { BigNumber as BN } from "bignumber.js";
import {
    BoolTrade,
    Profcalcs,
    Quotes,
    Repays,
} from "../../../constants/interfaces";
import { BigInt2BN, fu } from "../../modules/convertBN";
import { AmountConverter } from "./AmountConverter";
import { walletTradeSize } from "../modules/tools/walletTradeSizes";

export class ProfitCalculator {
    repays: Repays;
    trade: BoolTrade;
    quotes: Quotes;
    calc: AmountConverter;

    constructor(
        trade: BoolTrade,
        calc: AmountConverter,
        repays: Repays,
        quotes: Quotes,
    ) {
        this.trade = trade;
        this.quotes = quotes;
        this.calc = calc;
        this.repays = repays;
    }

    async getMultiProfit(): Promise<Profcalcs> {
        try {
            let profit: Profcalcs = { singleProfit: 0n, flashProfit: 0n };
            profit.flashProfit =
                this.quotes.target.flashTokenOutOut > this.repays.flashMulti
                    ? this.quotes.target.flashTokenOutOut -
                      this.repays.flashMulti
                    : 0n;
            const profitBN = BigInt2BN(
                profit.flashProfit,
                this.trade.tokenOut.data.decimals,
            );
            // console.log(profit);
            return profit;
        } catch (error: any) {
            console.log("Error in getMultiProfit: " + error.message);
            return { singleProfit: 0n, flashProfit: 0n };
        }
    }

    async getSingleProfit(): Promise<Profcalcs> {
        try {
            let wallet = await walletTradeSize(this.trade);
            const repays = this.repays;
            // This actually gets traded back into tokenIn, but for now we're representing it as tokenOut until I add the switch in the logs.
            // *update: I'll keep the profit in tokenOut but just trade back for my original tradeSize amount, to keep things easier.
            let singleProfit =
                this.quotes.target.tokenOutOut -
                this.quotes.loanPool.tokenOutOut;

            const flashProfit =
                this.quotes.target.flashTokenOutOut > repays.flashSingle
                    ? this.quotes.target.flashTokenOutOut - repays.flashSingle
                    : 0n;
            const profCalcs = { singleProfit, flashProfit };
            return profCalcs;
        } catch (error: any) {
            console.log("Error in getSingleProfit: " + error.trace);
            console.log(error);
            return { singleProfit: 0n, flashProfit: 0n };
        }
    }
}
