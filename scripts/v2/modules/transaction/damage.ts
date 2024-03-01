import { BoolTrade, PendingTx } from "../../../../constants/interfaces";
import { trueProfit } from "../trueProfit";
import { execute } from "./execute";
import { BigNumber as BN } from "bignumber.js";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu } from "../../../modules/convertBN";
import { swap } from "./swap";
import { pendingTransactions } from "../../control";
import { provider } from "../../../../constants/provider";
import { TransactionReceipt } from "ethers";
/**
 * Executes profitable trades
 * @param trade
 * @param data
 * @param warning
 * @param
 * @param pendingID
 * @returns
 */

export async function rollDamage(trade: BoolTrade) {
    // const profpercBN = BN(fu(trade.profitPercent, trade.tokenOut.decimals))
    if (pendingTransactions[trade.ID]) {
        logger.info(":::::::::::::::", trade.ticker, trade.ID, ": PENDING TRANSACTION ");
        return trade;
    }

    if (trade.profits.tokenProfit > 0n) {
        trade = await trueProfit(trade);
        trade.profits.WMATICProfit = trade.profits.WMATICProfit;

        const log = await tradeLogs(trade);

        console.log(
            "Trade Type: ",
            trade.type,
            " | ",
            trade.ticker,
            " | ",
            trade.loanPool.exchange,
            " | ",
            trade.target.exchange,
        );

        if (trade.profits.WMATICProfit > trade.gas.gasPrice) {
            pendingTransactions[trade.ID] = true;
            logger.info(
                "====================" +
                    "Profitable trade found on " +
                    trade.ticker +
                    "!" +
                    "====================",
            );
            // logger.info(log);
            logger.info(
                "Ticker: ",
                trade.ticker,
                " | ",
                "Loan Pool: ",
                trade.loanPool.exchange,
                " | ",
                "Target: ",
                trade.target.exchange,
                " | ",
                "Trade Size: ",
                fu(trade.target.tradeSize.size, trade.tokenIn.decimals),
                "Profit: ",
                fu(trade.profits.WMATICProfit, 18),
                "Gas Cost: ",
                fu(trade.gas.gasPrice, 18),
                "Flash Type: ",
                trade.type,
            );
            logger.info(
                "====================" + "Trade Data " + trade.ticker + "====================",
            );

            try {
                let tradeExecutionResult;
                let receipt: TransactionReceipt | undefined;
                pendingTransactions[trade.ID] = true;
                // Execute trade
                if (trade.type == "flashMulti" || trade.type == "flashSingle") {
                    tradeExecutionResult = await execute(trade);
                }
                if (trade.type == "single") {
                    tradeExecutionResult = await swap(trade);
                }
                // if execute returns either txresponse or undefined, remove it from pendingTrades:
            } catch (error) {
                logger.error("Error executing trade: ", error);
            }
        }

        // If profit is less than gas cost, return
        if (trade.profits.WMATICProfit < trade.gas.gasPrice) {
            console.log(
                "<<<<<<<<<<<<No Trade After trueProfit: " +
                    trade.ticker +
                    " [ gas " +
                    fu(trade.gas.gasPrice, 18) +
                    " > profit: " +
                    fu(trade.profits.WMATICProfit, 18) +
                    " tokenOut profit: " +
                    trade.tokenOut.symbol,
                fu(trade.profits.tokenProfit, trade.tokenOut.decimals) + " ] >>>>>>>>>>>>",
            );
            return;
        }

        // If profit is undefined, return
        if (trade.profits.WMATICProfit == undefined) {
            console.log(
                ">>>>>>>>>>>>>>>>>>>>>>>>>>>>Profit is undefined: error in gasVProfit<<<<<<<<<<<<<<<<<<<<<<<<",
            );
            return;
        }

        // If profit is less than 0, return
    } else if (trade.type !== "filtered" /*&& profpercBN.gt(-0.6)*/) {
        // TESTING
        // const log = await tradeLogs(trade)
        // console.log(log)
        // console.log("<<<<<<<<<<<<No Trade: " + trade.ticker + " : tradeSize: " + fu(trade.target.tradeSize.size, trade.tokenIn.decimals) + " : " + trade.loanPool.exchange + trade.target.exchange + " | " + profpercBN.toFixed(trade.tokenOut.decimals) + " ] >>>>>>>>>>>>")
        return;
    }
}
