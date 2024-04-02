import { ethers, Transaction, TransactionRequest } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { BoolTrade } from "../../../../constants/interfaces";
import { swapID } from "../../../../constants/environment";
// import { pendingApprovals } from "../../control";

export async function approve(
    token: string,
    spender: string,
    maxInt: bigint,
): Promise<bigint> {
    const tokenContract = new ethers.Contract(token, IERC20, signer);
    const ownerAddress = await signer.getAddress();
    let allowance: bigint = await tokenContract.allowance(
        ownerAddress,
        spender,
    );
    // const maxInt = ethers.MaxInt256;
    try {
        if (allowance == 0n) {
            const approvalTx = await tokenContract.approve(spender, maxInt);
            const tx = await signer.populateTransaction(approvalTx);
            const response = await signer.sendTransaction(tx);
            await response.wait();
            // tokenContract.on("Approval", (owner, spender, amount) => {
            //     console.log("Approval event: ", owner, spender, amount, event);
            // });
            const tokenAllowance = await tokenContract.allowance(
                ownerAddress,
                spender,
            );
            // console.log("Token allowance: ", tokenAllowance);
            return tokenAllowance;
        }
    } catch (error: any) {
        console.error(`Error in token approval for ${token}:`, error.message);
        throw error;
    }
    return allowance;
}
