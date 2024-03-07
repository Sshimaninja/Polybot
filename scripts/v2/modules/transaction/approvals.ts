import { ethers, TransactionRequest, TransactionReceipt, Transaction } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { pendingTransactions } from "../../control";
import { BoolTrade } from "../../../../constants/interfaces";
export async function checkApproval(trade: BoolTrade): Promise<boolean> {
    if (pendingTransactions[trade.ID] == true) {
        return false;
    }
    // let MaxInt256 = maxInt;
    let tokenIn = new ethers.Contract(trade.tokenIn.data.id, IERC20, signer);
    let tokenOut = new ethers.Contract(trade.tokenOut.data.id, IERC20, signer);
    // let allowance = await tokenIn.allowance(await signer.getAddress(), trade.tokenIn.data.id);

    // APPROVALS WORKED FINE ON MAINNET:

    // let nonce = await signer.getNonce();
    let ownerAddress = await signer.getAddress();

    let routerID = trade.target.router.getAddress();
    let allowance = await tokenIn.allowance(ownerAddress, routerID);
    let maxInt = ethers.MaxInt256;
    console.log("maxInt: ", maxInt);
    try {
        if (allowance > trade.tradeSizes.pool0.token0.size) {
            console.log("Already approved: ", trade.tokenIn.data.symbol, allowance);
            return true;
        }
        // let maxUintValue = maxInt;
        let approveIn: Transaction = await tokenIn.approve(routerID, maxInt);
        let receipt = approveIn.hash;
        console.log(
            "Approved : ",
            trade.tokenIn.data.symbol,
            await tokenIn.allowance(routerID, trade.tokenIn.data.id),
            "receipt: ",
            receipt,
        );
    } catch (error: any) {
        console.log("error in tokenIn checkApproval:");
        console.error(error);
        return false;
    }
    try {
        if (allowance > trade.tradeSizes.pool1.token1.size) {
            console.log("Already approved: ", trade.tokenOut.data.symbol, allowance);
            return true;
        }
        // let maxUintValue = maxInt;
        let approveIn: Transaction = await tokenOut.approve(routerID, maxInt);
        let receipt = approveIn.hash;
        console.log(
            "Approved : ",
            trade.tokenOut.data.symbol,
            await tokenIn.allowance(routerID, trade.tokenIn.data.id),
            "receipt: ",
            receipt,
        );
    } catch (error: any) {
        console.log("error in tokenOut checkApproval:");
        console.error(error);
        return false;
    }
    return false;
}
