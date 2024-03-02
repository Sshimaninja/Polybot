import { Transaction, TransactionReceipt, ethers } from "ethers";
import { swapSingle } from "../../../../constants/environment";
import { BoolTrade } from "../../../../constants/interfaces";
import { fu, pu } from "../../../modules/convertBN";
import { provider, signer } from "../../../../constants/provider";
import { logger } from "../../../../constants/logger";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { tradeLogs } from "../../modules/tradeLog";
import { walletBal } from "../tools/walletBal";
import { pendingTransactions } from "../../control";
import { checkApproval } from "./approvals";
import { TransactionResponse } from "alchemy-sdk";

export async function swap(trade: BoolTrade): Promise<ethers.TransactionReceipt | null> {
    const swapSingleAddress = await swapSingle.getAddress();
    const logs = await tradeLogs(trade);
    if (pendingTransactions[trade.ID]) {
        logger.info(
            "::::::::::::::::TRADE " +
                trade.ticker +
                " " +
                trade.profits.tokenProfit +
                " " +
                trade.tokenOut +
                " PENDING",
        );
        return null;
    }
    logger.info(
        ":::::::::::::::::::sending swap tx ",
        trade.ticker,
        trade.loanPool.exchange,
        trade.target.exchange,
        fu(trade.profits.tokenProfit, trade.tokenOut.decimals),
        trade.tokenOut.symbol,
    );
    if (trade.wallet.token0Balance < trade.tradeSizes.pool0.token0.size) {
        logger.info("::::::::::::::::TRADE " + trade.ticker + " INSUFFICIENT BALANCE");
        return null;
    }
    try {
        const p = {
            routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
            routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
            tradeSize: trade.tradeSizes.pool0.token0.size,
            amountOutA: trade.quotes.target.token1Out, //high Output tokenIn to tokenOut
            amountOutB: trade.quotes.loanPool.token0Out, //high Output tokenOut to tokenIn
            path0: [trade.tokenIn.id, trade.tokenOut.id],
            path1: [trade.tokenOut.id, trade.tokenIn.id],
            to: await signer.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
        };
        // const m = {
        //     //message describing trade for my own info/debug
        // };
        // // console.log(m);

        const oldBal = await walletBal(trade.tokenIn, trade.tokenOut);
        pendingTransactions[trade.ID] = true;
        let tx: Transaction = await swapSingle.swapSingle(
            p.routerAID,
            p.routerBID,
            p.tradeSize,
            p.amountOutA,
            p.amountOutB,
            p.path0,
            p.path1,
            p.to,
            p.deadline,
            {
                Type: 2,
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
            },
        );
        const txResponse = await signer.sendTransaction(tx);
        const receipt = await txResponse.wait(30);
        pendingTransactions[await trade.target.pool.getAddress()] = false;
        if (!receipt) {
            logger.info("Transaction failed with txResponse: " + txResponse);
            return null;
        }
        logger.info("TRANSACTION COMPLETE: " + trade.ticker, receipt.hash);

        //Print balances after trade
        const newBal = await walletBal(trade.tokenIn, trade.tokenOut);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>Old Balance: ", oldBal);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>New Balance: ", newBal);
        logger.info("::::::::::::::::::::::::END TRANSACTION::::::::::::::::::::::");
        return receipt;
    } catch (error: any) {
        if (error.message.includes("INSUFFICIENT_INPUT_AMOUNT")) {
            logger.error(">>>>>>>>>>>>>>>>>>>>Error in swap: ");
            logger.error(error);
            logger.error(">>>>>>>>>>>>>>>>>>>>TRADE LOGS:>>>>>>>>>>>>>>>>>>>> ");
            logger.error(logs);
            logger.error(">>>>>>>>>>>>>>>>>>>>TRADE LOGS:>>>>>>>>>>>>>>>>>>>> ");
        } else {
            logger.info(logs);
            logger.info(">>>>>>>>>>>>>>>>>>>>Error in swap: ");
            logger.info(error);
            logger.info(">>>>>>>>>>>>>>>>>>>>TRADE LOGS:>>>>>>>>>>>>>>>>>>>> ");
        }
        return null;
    }
}
