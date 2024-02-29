import { ethers } from "ethers";
import { swapSingle } from "../../../../constants/environment";
import { BoolTrade } from "../../../../constants/interfaces";
import { fu, pu } from "../../../modules/convertBN";
import { provider, signer } from "../../../../constants/provider";
import { logger } from "../../../../constants/logger";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { tradeLogs } from "../../modules/tradeLog";
import { checkBal } from "../tools/checkBal";

export async function swap(trade: BoolTrade): Promise<ethers.TransactionReceipt | null> {
    let nonce = await provider.getTransactionCount(await signer.getAddress());
    const signerAddress = await signer.getAddress();
    const swapSingleAddress = await swapSingle.getAddress();
    const logs = await tradeLogs(trade);
    console.log(":::::::::::::::::::sending tx:::::::::::::::: ");
    try {
        const p = {
            routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
            routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
            tradeSize: trade.target.tradeSize.size,
            amountOutA: trade.quotes.target.out, //high Output tokenIn to tokenOut
            amountOutB: trade.quotes.loanPool.in, //high Output tokenOut to tokenIn
            path0: [trade.tokenIn.id, trade.tokenOut.id],
            path1: [trade.tokenOut.id, trade.tokenIn.id],
            to: await signer.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
        };
        // const b = {
        //     tradeSize: fu(p.tradeSize, trade.tokenIn.decimals),
        //     reservesA: fu(trade.target.reserveOut, trade.tokenOut.decimals),
        //     amountOutA: fu(p.amountOutA, trade.tokenOut.decimals),
        //     reservesB: fu(trade.loanPool.reserveIn, trade.tokenIn.decimals),
        //     amountOutB: fu(p.amountOutB, trade.tokenOut.decimals),
        // };
        // console.log(b);
        let tokenIn = new ethers.Contract(p.path0[0], IERC20, signer);
        await tokenIn.approve(swapSingleAddress, p.tradeSize);
        const oldBal = await checkBal(trade.tokenIn, trade.tokenOut);
        let tx = await swapSingle.swapSingle(
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
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
                // nonce: nonce,
            },
        );
        let receipt = await provider.waitForTransaction(tx.hash);
        logger.info(
            ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>Transaction receipt: ",
            receipt,
            "<<<<<<<<<<<<<<<<<<",
        );
        const newBal = await checkBal(trade.tokenIn, trade.tokenOut);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>Old Balance:::::::::::::::::::::::: ", oldBal);
        logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>new Balance:::::::::::::::::::::::: ", newBal);
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

// function swapSingle(
//     address router0ID,
//     address router1ID,
//     address token0ID,
//     address token1ID,
//     uint256 amountIn,
//     uint256 amountOutMin0,
//     uint256 amountOutMin1,
//     address[] memory path0,
//     address[] memory path1,
//     address to,
//     uint256 deadline

// code: 'UNKNOWN_ERROR',
// error: {
//   code: -32000,
//   message: "Nonce too high. Expected nonce to be 2418 but got 2830. Note that transactions can't be queued when automining.",
//   data: {
//     message: "Nonce too high. Expected nonce to be 2418 but got 2830. Note that transactions can't be queued when automining."
//   }
// },
// payload: {
//   method: 'eth_sendRawTransaction',
//   params: [
//     [DATA]
//   ],
//   id: 20885,
//   jsonrpc: '2.0'
// },
// shortMessage: 'could not coalesce error'
// }
