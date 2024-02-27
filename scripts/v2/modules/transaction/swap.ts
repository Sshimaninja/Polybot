import { ethers } from "ethers";
import { BoolTrade } from "../../../../constants/interfaces";
import { pu } from "../../../modules/convertBN";
import { provider, signer } from "../../../../constants/provider";
export async function swap(trade: BoolTrade): Promise<ethers.TransactionReceipt | null> {
    try {
        const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes
        let tx = await trade.flash.swapSingle(
            trade.loanPool.router,
            trade.target.router,
            trade.target.tradeSize,
            trade.quotes.loanPool.out,
            trade.quotes.target.out,
            [trade.tokenIn.id, trade.tokenOut.id],
            [trade.tokenOut.id, trade.tokenIn.id],
            signer.address,
            deadline,
            {
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
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
