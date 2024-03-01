import { logger } from "../../../../constants/logger";
import { BoolTrade, Profit, TxData, V2Params, V2Tx, TxGas } from "../../../../constants/interfaces";
import { checkBal, checkGasBal } from "../tools/checkBal";
// import { logEmits } from "./emits";
import { send } from "./send";
import { notify } from "./notify";
import { pendingTransactions } from "../../control";
import { fu } from "../../../modules/convertBN";
import { TransactionReceipt } from "ethers";

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

export async function execute(trade: BoolTrade): Promise<TransactionReceipt | null> {
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
            return null;
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
            const oldBal = await checkBal(trade.tokenIn, trade.tokenOut);
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
            const receipt = await req.txResponse?.wait();
            console.log("Transaction response: ", r);

            //Print balances after trade
            const newBal = await checkBal(trade.tokenIn, trade.tokenOut);
            logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>Old Balance:::::::::::::::::::::::: ", oldBal);
            logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>New Balance:::::::::::::::::::::::: ", newBal);
            logger.info(":::::::::::::::END TRANSACTION:::::::::::::::");

            // Clear the pending transaction flag for this pool
            pendingTransactions[await trade.target.pool.getAddress()] = false;

            if (receipt) {
                return receipt;
            } else {
                logger.info(
                    "::::::::::::::::::::::::::::::::::::::::TRADE UNDEFINED::::::::::::::::::::::::::::::::::::::: ",
                );

                logger.info(
                    "::::::::::::::::::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::::::::::::::::::::",
                );

                return null;
            }
        } else {
            logger.info(
                "::::::::::::::::::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::::::::::::::::::::",
            );
            return null;
        }
    }
    return null;
}
