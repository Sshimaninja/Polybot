import { BoolTrade, PendingTx } from "../../../constants/interfaces";
import { trueProfit } from "./trueProfit";
import { execute } from "./transaction/execute";
import { BigNumber as BN } from "bignumber.js";
import { tradeLogs } from "./tradeLog";
import { logger } from "../../../constants/logger";
import { fu } from "../../modules/convertBN";
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

        // console.log(await tradeLogs(trade)); //debug

        if (
            trade.profits.profitToken > 0n &&
            trade.k.uniswapKPositive //&&
        ) {
            trade = await trueProfit(trade);
            trade.profits.profitWMATIC = trade.profits.profitWMATIC;

            // logger.info(
            //     ">>>>>>>>>>>>>>CHECKING TRADE PROFIT CALCS: ",
            //     fu(trade.profits.profitWMATIC, 18),
            // );
            const log = await tradeLogs(trade);
            console.log(log);
            // If profit is greater than gas cost, execute trade
            if (trade.profits.profitWMATIC > trade.gas.gasPrice) {
                logger.info(
                    "====================" +
                        "Profitable trade found on " +
                        trade.ticker +
                        "!" +
                        "====================",
                );
                logger.info(log);
                logger.info(
                    "Profit: ",
                    fu(trade.profits.profitWMATIC, 18),
                    "Gas Cost: ",
                    fu(trade.gas.gasPrice, 18),
                    "Flash Type: ",
                    trade.type,
                );
                logger.info(
                    "====================" + "Trade Data " + trade.ticker + "====================",
                );
                pendingTrades.push(newTx);
                // Execute trade
                const x = await execute(trade);
                // if execute returns either txresponse or undefined, remove it from pendingTrades:
                if (x.txResponse || x.txResponse == undefined) {
                    pendingTrades = pendingTrades.filter((tx) => tx.ID !== trade.ID);
                }
                return;
            }

            // If profit is less than gas cost, return
            if (trade.profits.profitWMATIC < trade.gas.gasPrice) {
                console.log(
                    "<<<<<<<<<<<<No Trade After trueProfit: " +
                        trade.ticker +
                        " [ gas " +
                        fu(trade.gas.gasPrice, 18) +
                        " > profit: " +
                        fu(trade.profits.profitWMATIC, 18) +
                        " tokenOut profit: " +
                        trade.tokenOut.symbol,
                    fu(trade.profits.profitToken, trade.tokenOut.decimals) + " ] >>>>>>>>>>>>",
                );
                return;
            }

            // If profit is undefined, return
            if (trade.profits.profitWMATIC == undefined) {
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
