import { ethers } from "ethers";
import { swapSingle } from "../../../../constants/environment";
import { BoolTrade } from "../../../../constants/interfaces";
import { pu } from "../../../modules/convertBN";
import { provider, signer } from "../../../../constants/provider";

export async function swap(trade: BoolTrade): Promise<ethers.TransactionReceipt | null> {
    let nonce = await provider.getTransactionCount(await signer.getAddress());
    let signerAddress = await signer.getAddress();
    try {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes
        let tx = await swapSingle.swapSingle(
            await trade.loanPool.router.getAddress(),
            await trade.target.router.getAddress(),
            trade.tokenIn.id,
            trade.tokenOut.id,
            trade.target.tradeSize.size,
            trade.quotes.loanPool.out,
            trade.quotes.target.out,
            [trade.tokenIn.id, trade.tokenOut.id],
            [trade.tokenOut.id, trade.tokenIn.id],
            signerAddress,
            deadline,
            {
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
                nonce: nonce,
            },
        );
        let receipt = await provider.waitForTransaction(tx.hash);
        console.log("Transaction receipt: ", receipt);
        return receipt;
    } catch (error: any) {
        console.log("Error in swap: ", error);
        return error;
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
