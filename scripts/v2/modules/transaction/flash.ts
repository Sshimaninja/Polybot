import { logger } from "../../../../constants/logger";
import { BoolTrade, Profit, TxData, V2Params, V2Tx, TxGas } from "../../../../constants/interfaces";
import { walletBal, checkGasBal } from "../tools/walletBal";
import { notify } from "./notify";
import { pendingTransactions } from "../../control";
import { fu } from "../../../modules/convertBN";
import { TransactionReceipt, Transaction } from "ethers";
import { Hash } from "crypto";
import { signer } from "../../../../constants/provider";

/**
 * @param trade
 * @param gasCost
 * @returns
 * @description
 */

export async function flash(trade: BoolTrade): Promise<TransactionReceipt | null> {
    logger.info("::::::::::::BEGIN TRANSACTION: ", trade.ticker, "::::::::::::");

    var gasbalance = await checkGasBal();
    logger.info("Wallet Balance Matic: ", fu(gasbalance, 18), "MATIC");
    logger.info("Wallet Balance Matic: ", fu(gasbalance, 18), "MATIC");
    logger.info("Gas Cost::::::::::::", fu(trade.gas.gasPrice, 18));

    const gotGas = trade.gas.gasPrice < gasbalance;
    if (!gotGas) {
        console.log(">>>>Insufficient Matic Balance<<<<");
        return null;
    }
    // Set the pending transaction flag for this pool
    const oldBal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
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

    let tx: Transaction = await trade.flash.flashSwap(
        trade.loanPool.factory,
        trade.loanPool.router,
        trade.target.router,
        trade.tokenIn.data.id,
        trade.tokenOut.data.id,
        trade.tradeSizes.pool0.token0.size,
        trade.quotes.target.token1Out,
        trade.loanPool.amountRepay,
        {
            Type: 2,
            gasLimit: trade.gas.gasEstimate,
            maxFeePerGas: trade.gas.maxFee,
            maxPriorityFeePerGas: trade.gas.maxPriorityFee,
        },
    );
    try {
        // const signedTx = await wallet.signTransaction(tx);
        const txResponse = await signer.sendTransaction(tx);
        const receipt = await txResponse.wait(30);
        pendingTransactions[await trade.target.pool.getAddress()] = false;
        if (!receipt) {
            logger.info("Transaction failed with txResponse: " + txResponse);
            return null;
        }
        logger.info("TRANSACTION COMPLETE: " + trade.ticker, receipt.hash);

        //Print balances after trade
        const newBal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>Old Balance: ", oldBal);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>New Balance: ", newBal);
        logger.info("::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::");
        return receipt;
        // Clear the pending transaction flag for this pool
    } catch (error: any) {
        logger.info(`Transaction failed. Error: ${error.message}`);
    }
    return null;
}
