import { BoolTrade, PendingTx } from "../../../../constants/interfaces";
import { trueProfit } from "../trueProfit";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu } from "../../../modules/convertBN";
import { pendingTransactions } from "../../control";
/**
 * Executes profitable trades
 * @param trade
 * @param data
 * @param warning
 * @param
 * @param pendingID
 * @returns
 */

export async function rollDamage(trade: BoolTrade): Promise<BoolTrade> {
    if (pendingTransactions[trade.ID]) {
        logger.info(":::::::::::::::", trade.ticker, trade.ID, ": PENDING TRANSACTION ");
        return trade;
    }

    if (trade.type.includes("filtered")) {
        return trade;
    }
    trade = await trueProfit(trade);
    trade.profits = {
        tokenProfit: trade.profits.tokenProfit,
        WMATICProfit: trade.profits.WMATICProfit,
    };
    trade.profits.WMATICProfit = trade.profits.WMATICProfit;

    // Only populate after wmaticprofit is in:
    const log = await tradeLogs(trade);
    if (trade.profits.WMATICProfit > trade.gas.gasPrice) {
        logger.info("[damage]:");
        logger.info(log);
        // console.log(
        //     "Trade Type: ",
        //     trade.type,
        //     " | ",
        //     trade.ticker,
        //     " | ",
        //     trade.loanPool.exchange,
        //     " | ",
        //     trade.target.exchange,
        // );
    }
    return trade;
}
