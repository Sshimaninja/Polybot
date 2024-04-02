import { BigNumber as bigint } from "bignumber.js";
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

    async getMultiFlashProfit(): Promise<bigint> {
        let profit: bigint = 0n;
        try {
            profit =
                this.quotes.target.flashTokenOutOut > this.repays.flashMulti
                    ? this.quotes.target.flashTokenOutOut -
                      this.repays.flashMulti
                    : 0n;
            const profitbigint = BigInt2BN(
                profit,
                this.trade.tokenOut.data.decimals,
            );

            // console.log(profit);

            return profit;
        } catch (error: any) {
            console.log("Error in getMultiProfit: " + error.message);
            return profit;
        }
    }

    async getSingleFlashProfit(): Promise<bigint> {
        let profit: bigint = 0n;

        try {
            let wallet = await walletTradeSize(this.trade);
            const repays = this.repays;
            // This actually gets traded back into tokenIn, but for now we're representing it as tokenOut until I add the switch in the logs.
            // *update: I'll keep the profit in tokenOut but just trade back for my original tradeSize amount, to keep things easier.
            // *update: I'm changing the logs to show profit in tokenIn because it's more accurate.

            profit =
                this.quotes.target.flashTokenOutOut > repays.flashSingle
                    ? this.quotes.target.flashTokenOutOut - repays.flashSingle
                    : 0n;

            return profit;
        } catch (error: any) {
            console.log("Error in getSingleProfit: " + error.trace);
            console.log(error);
            return profit;
        }
    }

    async getMultiProfit(): Promise<bigint> {
        let profit: bigint = 0n;
        profit =
            this.quotes.target.tokenOutOut - this.quotes.loanPool.tokenOutOut;
        return profit;
    }

    async getSingleProfit(): Promise<bigint> {
        let profit: bigint = 0n;
        // let wallet = await walletTradeSize(this.trade);
        const repays = this.repays;
        profit =
            this.quotes.loanPool.tokenInOut - this.quotes.target.tokenInOut;
        return profit;
    }
}
