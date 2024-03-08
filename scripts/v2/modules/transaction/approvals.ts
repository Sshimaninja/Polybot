import { ethers, TransactionRequest, TransactionReceipt, Transaction } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { pendingTransactions } from "../../control";
import { BoolTrade } from "../../../../constants/interfaces";
import { swapSingle, swapSingleID } from "../../../../constants/environment";
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
    let swapContract = swapSingle;
    let routerID = trade.target.router.getAddress();
    let tokenInAllowance = await tokenIn.allowance(ownerAddress, routerID);
    let tokenOutAllowance = await tokenOut.allowance(ownerAddress, routerID);
    let maxInt = ethers.MaxInt256;
    // console.log("maxInt: ", maxInt);
    try {
        if (tokenInAllowance > trade.tradeSizes.loanPool.tradeSizeToken0.size) {
            console.log("Already approved: ", trade.tokenIn.data.symbol, tokenInAllowance);
            return true;
        }
        // let maxUintValue = maxInt;
        let approveInRouter: Transaction = await tokenIn.approve(routerID, maxInt);
        let approveInSwapContract: Transaction = await tokenIn.approve(
            await swapContract.getAddress(),
            maxInt,
        );
        let receiptRotuer = approveInRouter.hash;
        let receiptSwapContract = approveInSwapContract.hash;
        console.log(
            "Approved Router: ",
            trade.tokenIn.data.symbol,
            await tokenIn.allowance(routerID, trade.tokenIn.data.id),
            "receipt: ",
            receiptRotuer,
        );
        console.log(
            "Approved SwapContract: ",
            trade.tokenIn.data.symbol,
            await tokenIn.allowance(await swapContract.getAddress(), trade.tokenIn.data.id),
            "receipt: ",
            receiptSwapContract,
        );
    } catch (error: any) {
        console.log("error in tokenIn checkApproval:");
        console.error(error);
        return false;
    }
    try {
        if (tokenOutAllowance > trade.tradeSizes.target.tradeSizeToken1.size) {
            console.log("Already approved: ", trade.tokenOut.data.symbol, tokenOutAllowance);
            return true;
        }
        let approveOutRouter: Transaction = await tokenOut.approve(routerID, maxInt);
        let approveOutSwapContract: Transaction = await tokenOut.approve(
            await swapContract.getAddress(),
            maxInt,
        );
        let receiptRotuer = approveOutRouter.hash;
        let receiptSwapContract = approveOutSwapContract.hash;
        console.log(
            "Approved Router: ",
            trade.tokenOut.data.symbol,
            await tokenOut.allowance(routerID, trade.tokenOut.data.id),
            "receipt: ",
            receiptRotuer,
        );
        console.log(
            "Approved SwapContract: ",
            trade.tokenOut.data.symbol,
            await tokenOut.allowance(await swapContract.getAddress(), trade.tokenOut.data.id),
            "receipt: ",
            receiptSwapContract,
        );
    } catch (error: any) {
        console.log("error in tokenOut checkApproval:");
        console.error(error);
        return false;
    }
    return false;
}
