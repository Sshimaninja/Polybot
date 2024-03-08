import { MaxInt256, Transaction, TransactionReceipt, ethers } from "ethers";
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
                trade.tokenOut.data +
                " PENDING",
        );
        return null;
    }
    logger.info(
        ":::::::::::::::::::sending swap tx ",
        trade.ticker,
        trade.loanPool.exchange,
        trade.target.exchange,
        fu(trade.profits.tokenProfit, trade.tokenOut.data.decimals),
        trade.tokenOut.data.symbol,
    );
    if (trade.wallet.token0Balance < trade.tradeSizes.loanPool.tradeSizeToken0.size) {
        logger.info("::::::::::::::::TRADE " + trade.ticker + " INSUFFICIENT BALANCE");
        return null;
    }

    try {
        let swapSingleAddress = await swapSingle.getAddress();

        let p = trade.params;

        // let approveRouter = await trade.tokenIn.contract.approve(trade.target.router, MaxInt256);
        // let approveSwapSingle = await trade.tokenIn.contract.approve(swapSingleAddress, MaxInt256);

        // Wait for the approval transactions to be mined
        // await approveRouter.wait();
        // await approveSwapSingle.wait();
        console.log(
            "Target router approval amount: ",
            trade.tokenIn.contract.allowance(await signer.getAddress(), trade.target.router),
        );
        console.log(
            "SwapSingle approval amount: ",
            trade.tokenIn.contract.allowance(await signer.getAddress(), swapSingleAddress),
        );
        const oldBal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
        pendingTransactions[trade.ID] = true;

        let tx: Transaction = await swapSingle.swapSingle(
            p.target,
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
        const txHash = txResponse.hash;

        const receipt = await txResponse.wait(30);
        if (receipt) {
            pendingTransactions[trade.ID] = false;
        }
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
