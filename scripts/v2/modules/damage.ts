import { BoolTrade, PendingTx } from "../../../constants/interfaces";
import { trueProfit } from "./trueProfit";
import { execute } from "./transaction/execute";
import { BigNumber as BN } from "bignumber.js";
import { tradeLogs } from "./tradeLog";
import { logger } from "../../../constants/logger";
import { fu } from "../../modules/convertBN";
import { swap } from "./transaction/swap";
import { provider } from "../../../constants/provider";
/**
 * Executes profitable trades
 * @param trade
 * @param data
 * @param warning
 * @param
 * @param pendingID
 * @returns
 */

var pendingTrades: PendingTx[] = [];
console.log(pendingTrades); //debug

export async function rollDamage(trade: BoolTrade) {
    // const profpercBN = BN(fu(trade.profitPercent, trade.tokenOut.decimals))
    try {
        let newTx: PendingTx = {
            ID: trade.ID,
            warning: false,
        };
        // Conversion to BN because BN works with decimals

        if (pendingTrades.includes(newTx)) {
            console.log(
                "<<<<<<<<<<<<Trade Pending: " +
                    trade.ticker +
                    trade.loanPool.exchange +
                    trade.target.exchange +
                    " [ pending ] >>>>>>>>>>>>",
            );
            newTx = {
                ID: trade.ID,
                warning: true,
            };
            return;
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
                pendingTrades.push(newTx);

                try {
                    let tradeExecutionResult;
                    // Execute trade
                    if (trade.type == "flashMulti" || trade.type == "flashSingle") {
                        tradeExecutionResult = await execute(trade);
                    }
                    if (trade.type == "single") {
                        tradeExecutionResult = await swap(trade);
                    }
                    // if execute returns either txresponse or undefined, remove it from pendingTrades:
                    if (tradeExecutionResult) {
                        pendingTrades = pendingTrades.filter((tx) => tx.ID !== trade.ID);
                        // Log the transaction receipt
                    }
                } catch (error) {
                    logger.error("Error executing trade: ", error);
                    // Retry the trade or handle the error in some other way
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
    } catch (error: any) {
        logger.error("Error in rollDamage: ", error.reason);
    }
}
