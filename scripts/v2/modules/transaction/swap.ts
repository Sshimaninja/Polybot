import {
    MaxInt256,
    Transaction,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,
    ethers,
} from "ethers";
import { swap } from "../../../../constants/environment";
import { BoolTrade } from "../../../../constants/interfaces";
import { fu, pu } from "../../../modules/convertBN";
import { provider, signer } from "../../../../constants/provider";
import { logger } from "../../../../constants/logger";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { tradeLogs } from "../../modules/tradeLog";
import { walletBal } from "../tools/walletBal";
import { params } from "./params";
import { pendingTransactions } from "../../control";

export async function swapIt(
    trade: BoolTrade,
): Promise<TransactionResponse | null> {
    const swapAddress = await swap.getAddress();
    const logs = await tradeLogs(trade);
    if (pendingTransactions[trade.ID]) {
        logger.info(
            "::::::::TRADE " +
                trade.ticker +
                " profit: " +
                fu(trade.profits.tokenProfit, trade.tokenOut.data.decimals) +
                " " +
                trade.tokenOut.data.id +
                " PENDING",
        );
        return null;
    }
    logger.info(
        ":::::::::::::::::::sending swap tx ",
        trade.ticker,
        trade.loanPool.exchange,
        trade.target.exchange,
        "Projected profit:",
        fu(trade.profits.tokenProfit, trade.tokenIn.data.decimals),
        trade.tokenIn.data.symbol,
    );
    if (
        trade.wallet.tokenInBalance <
        trade.tradeSizes.loanPool.tradeSizeTokenIn.size
    ) {
        logger.info(
            "::::::::::::::::TRADE " + trade.ticker + " INSUFFICIENT BALANCE",
        );
        return null;
    }

    try {
        const oldBal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
        logger.info(
            ">>>>>>>>>>>Old Balance: ",
            "TokenIn: ",
            fu(oldBal.tokenIn, trade.tokenIn.data.decimals) +
                " " +
                trade.tokenIn.data.symbol,
            "TokenOut: ",
            fu(oldBal.tokenOut, trade.tokenOut.data.decimals) +
                " " +
                trade.tokenOut.data.symbol,
        );
        pendingTransactions[trade.ID] = true;
        let swapData = await params(trade);
        let tx: ethers.TransactionRequest = await swapData.swap;
        const txResponse = await signer.sendTransaction(tx);
        const receipt = txResponse.hash;

        // const receipt = await txResponse.wait();
        if (receipt) {
            console.log("Transaction hash: ", receipt);
            pendingTransactions[trade.ID] = false;
        }
        // if (!receipt) {
        //     logger.info("Transaction failed with txResponse: " + txResponse);
        //     return null;
        // }
        logger.info(
            "TRANSACTION COMPLETE: ",
            trade.ticker,
            trade.loanPool.exchange + trade.target.exchange,
            receipt,
            logs.data,
        );

        //Print balances after trade
        const newBal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
        logger.info(
            ">>>>>>>>>>>New Balance: ",
            "TokenIn: ",
            fu(newBal.tokenIn, trade.tokenIn.data.decimals) +
                " " +
                trade.tokenIn.data.symbol,
            "TokenOut: ",
            fu(newBal.tokenOut, trade.tokenOut.data.decimals) +
                " " +
                trade.tokenOut.data.symbol,
            "Profit in TokenIn: ",
            fu(newBal.tokenIn - oldBal.tokenIn, trade.tokenIn.data.decimals) +
                " " +
                trade.tokenIn.data.symbol,
        );
        logger.info(
            "::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::",
        );
        return txResponse;
    } catch (error: any) {
        if (error.message.includes("INSUFFICIENT_INPUT_AMOUNT")) {
            logger.error(
                ">>>>>Error in swap: INSUFFICIENT_INPUT_AMOUNT " + error,
            );
            // logger.error(error.reason);
            // logger.error(">>>>>TRADE LOGS:>>>>> ");
            // logger.error(logs);
            logger.error(">>>>>ERROR TRADE LOGS:>>>>> ");
        } else {
            // logger.info(logs);
            logger.info(">>>>>Error in swap: " + error.reason);
            logger.info(error);
            logger.info(">>>>>ERROR TRADE LOGS:>>>>> ");
        }
        return null;
    }
}
