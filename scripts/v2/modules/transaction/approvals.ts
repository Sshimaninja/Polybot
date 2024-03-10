import { ethers, Transaction } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { BoolTrade } from "../../../../constants/interfaces";
import { swapSingle } from "../../../../constants/environment";

async function approveToken(
    tokenAddress: string,
    spender: string,
    amount: bigint,
): Promise<boolean> {
    try {
        const token = new ethers.Contract(tokenAddress, IERC20, signer);
        const ownerAddress = await signer.getAddress();
        const allowance = await token.allowance(ownerAddress, spender);

        if (allowance > amount) {
            console.log(`Already approved ${tokenAddress} for ${spender}`);
            return true;
        }

        const approvalTx: Transaction = await token.approve(spender, amount);
        console.log(`Approved ${tokenAddress} for ${spender}: ${approvalTx.hash}`);
        return true;
    } catch (error: any) {
        console.error(`Error in token approval for ${tokenAddress}:`, error.reason);
        return false;
    }
}

export async function checkApproval(trade: BoolTrade): Promise<boolean> {
    const maxInt = ethers.MaxUint256;
    const swapContractAddress = await swapSingle.getAddress();
    const routerAddress = await trade.target.router.getAddress();

    const approveTokenInForRouter = await approveToken(
        trade.tokenIn.data.id,
        routerAddress,
        maxInt,
    );
    const approveTokenInForSwapContract = await approveToken(
        trade.tokenIn.data.id,
        swapContractAddress,
        maxInt,
    );
    const approveTokenOutForRouter = await approveToken(
        trade.tokenOut.data.id,
        routerAddress,
        maxInt,
    );
    const approveTokenOutForSwapContract = await approveToken(
        trade.tokenOut.data.id,
        swapContractAddress,
        maxInt,
    );

    return (
        approveTokenInForRouter &&
        approveTokenInForSwapContract &&
        approveTokenOutForRouter &&
        approveTokenOutForSwapContract
    );
}

// import { ethers, TransactionRequest, TransactionReceipt, Transaction } from "ethers";
// import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
// import { signer } from "../../../../constants/provider";
// import { pendingTransactions } from "../../control";
// import { BoolTrade } from "../../../../constants/interfaces";
// import { swapSingle, swapSingleID } from "../../../../constants/environment";
// export async function checkApproval(trade: BoolTrade): Promise<boolean> {
//     if (pendingTransactions[trade.ID] == true) {
//         return false;
//     }
//     // let MaxInt256 = maxInt;
//     let tokenIn = new ethers.Contract(trade.tokenIn.data.id, IERC20, signer);
//     let tokenOut = new ethers.Contract(trade.tokenOut.data.id, IERC20, signer);
//     // let allowance = await tokenIn.allowance(await signer.getAddress(), trade.tokenIn.data.id);

//     // APPROVALS WORKED FINE ON MAINNET:

//     // let nonce = await signer.getNonce();
//     let ownerAddress = await signer.getAddress();
//     let swapContract = swapSingle;
//     let swapContractID = await swapContract.getAddress();
//     let routerID = await trade.target.router.getAddress();
//     let tokenInAllowanceRouter = await tokenIn.allowance(ownerAddress, routerID);
//     let swapContractAllowanceIn = await tokenIn.allowance(ownerAddress, swapContractID);
//     let tokenOutAllowanceRouter = await tokenOut.allowance(ownerAddress, routerID);
//     let swapContractAllowanceOut = await tokenOut.allowance(ownerAddress, swapContractID);
//     let maxInt = ethers.MaxInt256;

//     // TODO: refactor
//     //     try {
//     //         async function approve(
//     //             contract: ethers.Contract,
//     //             spender: string,
//     //             amount: bigint,
//     //         ): Promise<Transaction> {
//     //             let approval: Transaction = await contract.approve(spender, amount);
//     //             let receipt = approval.hash;
//     //             console.log(
//     //                 "Approved ",
//     //                 contract.address,
//     //                 " for ",
//     //                 spender,
//     //                 " amount: ",
//     //                 amount,
//     //                 " receipt: ",
//     //                 receipt,
//     //             );
//     //             return approval;
//     //         }

//     //         let approveRouterIn: Transaction = await approve(tokenIn, routerID, maxInt);
//     //         let approveSwapContractIn: Transaction = await approve(tokenIn, swapContractID, maxInt);
//     //         let approveRouterOut: Transaction = await approve(tokenOut, routerID, maxInt);
//     //         let approveSwapContractOut: Transaction = await approve(tokenOut, swapContractID, maxInt);
//     //         if (
//     //             approveRouterIn.hash &&
//     //             approveSwapContractIn.hash &&
//     //             approveRouterOut.hash &&
//     //             approveSwapContractOut.hash
//     //         ) {
//     //             return true;
//     //         }
//     //     } catch (error: any) {
//     //         console.log("error in checkApproval:");
//     //         console.error(error);
//     //         return false;
//     //     }
//     //     return false;
//     // }

//     try {
//         if (tokenInAllowanceRouter > trade.tradeSizes.loanPool.tradeSizeToken0.size) {
//             console.log(
//                 "Already approved Router ",
//                 trade.tokenIn.data.symbol,
//                 ": router: ",
//                 tokenInAllowanceRouter,
//             );
//         }

//         let approveInRouter: Transaction = await tokenIn.approve(routerID, maxInt);
//         let receiptRotuer = approveInRouter.hash;

//         console.log(
//             "Approved Router: ",
//             trade.tokenIn.data.symbol,
//             await tokenIn.allowance(ownerAddress, routerID),
//             "Approved swapContract: ",
//             await tokenIn.allowance(ownerAddress, swapContractID),
//             "receipt: ",
//             receiptRotuer,
//         );
//     } catch (error: any) {
//         console.log("error in tokenIn checkApproval:");
//         console.error(error);
//         return false;
//     }

//     try {
//         if (swapContractAllowanceIn > trade.tradeSizes.loanPool.tradeSizeToken0.size) {
//             console.log(
//                 "Already approved swapContract: ",
//                 trade.tokenIn.data.symbol,
//                 swapContractAllowanceOut,
//                 " swapContract: ",
//                 swapContractAllowanceOut,
//             );
//         }

//         let approveInSwapContract: Transaction = await tokenIn.approve(swapContractID, maxInt);
//         let receiptSwapContract = approveInSwapContract.hash;

//         console.log(
//             "Approved SwapContract: ",
//             trade.tokenIn.data.symbol,
//             await tokenIn.allowance(ownerAddress, swapContractID),
//             "receipt: ",
//             receiptSwapContract,
//         );
//     } catch (error: any) {
//         console.log("error in tokenIn checkApproval:");
//         console.error(error);
//         return false;
//     }
//     try {
//         if (tokenOutAllowanceRouter > trade.tradeSizes.target.tradeSizeToken1.size) {
//             console.log("Already approved: ", trade.tokenOut.data.symbol, tokenOutAllowanceRouter);
//         }
//         let approveOutRouter: Transaction = await tokenOut.approve(routerID, maxInt);

//         let receiptRotuer = approveOutRouter.hash;
//         console.log(
//             "Approved RouterOut: ",
//             trade.tokenOut.data.symbol,
//             await tokenOut.allowance(ownerAddress, routerID),
//             "receipt: ",
//             receiptRotuer,
//         );
//     } catch (error: any) {
//         console.log("error in tokenOut checkApproval:");
//         console.error(error);
//         return false;
//     }

//     try {
//         if (swapContractAllowanceOut > trade.tradeSizes.target.tradeSizeToken1.size) {
//             console.log(
//                 "Already approved swapContractOut: ",
//                 trade.tokenOut.data.symbol,
//                 swapContractAllowanceOut,
//                 " swapContract: ",
//                 swapContractAllowanceOut,
//             );
//         }
//         let approveOutSwapContract: Transaction = await tokenOut.approve(swapContractID, maxInt);
//         let receiptSwapContract = approveOutSwapContract.hash;
//         console.log(
//             "Approved SwapContractOut: ",
//             trade.tokenOut.data.symbol,
//             await tokenOut.allowance(ownerAddress, swapContractID),
//             "receipt: ",
//             receiptSwapContract,
//         );
//     } catch (error: any) {
//         console.log("error in tokenOut checkApproval:");
//         console.error(error);
//         return false;
//     }
//     return true;
// }
