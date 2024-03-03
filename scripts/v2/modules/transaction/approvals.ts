import { ethers } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { pendingTransactions } from "../../control";
export async function checkApproval(
    tradeID: string,
    token: string,
    address: string,
    size: bigint,
): Promise<boolean> {
    if (pendingTransactions[tradeID] == true) {
        return false;
    }
    let tokenIn = new ethers.Contract(token, IERC20, signer);
    let allowance = await tokenIn.allowance(await signer.getAddress(), address);
    let nonce = await signer.getNonce();
    try {
        if (allowance > size) {
            return true;
        }
        let maxUintValue = ethers.MaxUint256;
        let approve = await tokenIn.approve(address, maxUintValue);
        await approve.wait(30);
        console.log("Approved: ", token, allowance);
    } catch (error: any) {
        console.log("error in checkApproval:");
        console.error(error);
        return true;
    }
    return false;
}
