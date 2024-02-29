import { logger } from "../../../../constants/logger";
import { BoolTrade, Profit, TxData, V2Params, V2Tx, TxGas } from "../../../../constants/interfaces";
import { checkBal, checkGasBal } from "../tools/checkBal";
// import { logEmits } from "./emits";
import { send } from "./send";
import { notify } from "./notify";
import { pendingTransactions } from "./pendingTransactions";
import { fu } from "../../../modules/convertBN";

/**
 * @param trade
 * @param gasCost
 * @returns
 * @description
 * This function sends the transaction to the blockchain.
 * It returns the transaction hash, and a boolean to indicate if the transaction is pending.
 * The transaction hash is used to check the status of the transaction.
 * The boolean is used to prevent multiple transactions from being sent.
 * If the transaction is pending, the function will return.
 * If the transaction is not pending, the function will send the transaction.
 * If the transaction is undefined, the function will return.
 */

// Keep track of pending transactions for each pool

export async function execute(trade: BoolTrade): Promise<TxData> {
    if (pendingTransactions[trade.ID]) {
        logger.info(
            "::::::::::::::::::::::::" +
                trade.ticker +
                trade.ID +
                ": PENDING TRANSACTION::::::::::::::::::::::::: ",
        );
        return {
            txResponse: undefined,
            pendingID: await trade.target.pool.getAddress(),
        };
    } else {
        logger.info(
            "::::::::::::::::::::::::::::::::::::::::BEGIN TRANSACTION: " +
                trade.ticker +
                "::::::::::::::::::::::::::",
        );

        var gasbalance = await checkGasBal();

        logger.info("Wallet Balance Matic: " + fu(gasbalance, 18) + " " + "MATIC");

        if (trade) {
            logger.info("Wallet Balance Matic: " + fu(gasbalance, 18) + " " + "MATIC");
            logger.info(
                "Gas Cost::::::::::::: " +
                    fu(trade.gas.gasPrice, 18) +
                    " " +
                    "MATIC (if this is tiny, it's probably because gasEstimate has failed.",
            );

            const gotGas = trade.gas.gasPrice < gasbalance;

            gotGas == true
                ? logger.info("Sufficient Matic Balance. Proceeding...")
                : console.log(">>>>Insufficient Matic Balance<<<<");

            if (gotGas == false) {
                logger.info(
                    ":::::::::::::::::::::::END TRANSACTION: " +
                        trade.ticker +
                        ": GAS GREATER THAN PROFIT::::::::::::::::::::::::: ",
                );
                return {
                    txResponse: undefined,
                    pendingID: null,
                };
            }

            if (gotGas == true) {
                let gasObj: TxGas = {
                    type: 2,
                    gasPrice: trade.gas.gasPrice,
                    maxFeePerGas: Number(trade.gas.maxFee),
                    maxPriorityFeePerGas: Number(trade.gas.maxPriorityFee),
                    gasLimit: trade.gas.gasEstimate, // * 10n,
                };

                // Set the pending transaction flag for this pool
                pendingTransactions[trade.ID] = true;

                logger.info(
                    ":::::::::::Sending Transaction: " +
                        trade.loanPool.exchange +
                        " to " +
                        trade.target.exchange +
                        " for " +
                        trade.ticker +
                        " : profit: " +
                        fu(trade.profits.WMATICProfit, 18) +
                        ":::::::::: ",
                );

                await notify(trade);

                const req = await send(trade);
                const r = req.txResponse;
                console.log("Transaction response: ", r);
                // const logs = await logEmits(trade, req);

                logger.info(
                    ":::::::::::::::::::::::::::::::::::Transaction logs::::::::::::::::::::::::: ",
                );
                // logger.info(logs);

                //Print balances after trade
                await checkBal(trade.tokenIn, trade.tokenOut);

                let result: TxData = {
                    txResponse: req.txResponse,
                    pendingID: null,
                };

                logger.info(
                    "::::::::::::::::::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::::::::::::::::::::",
                );

                // Clear the pending transaction flag for this pool
                pendingTransactions[await trade.target.pool.getAddress()] = false;

                return result;
            } else {
                logger.info(
                    "::::::::::::::::::::::::::::::::::::::::TRADE UNDEFINED::::::::::::::::::::::::::::::::::::::: ",
                );

                logger.info(
                    "::::::::::::::::::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::::::::::::::::::::",
                );

                return {
                    txResponse: undefined,
                    pendingID: null,
                };
            }
        } else {
            logger.info(
                "::::::::::::::::::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::::::::::::::::::::",
            );
            return {
                txResponse: undefined,
                pendingID: null,
            };
        }
    }
}
