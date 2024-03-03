import { ethers } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";

export async function checkApproval(
    token: string,
    address: string,
    size: bigint,
): Promise<boolean> {
    let tokenIn = new ethers.Contract(token, IERC20, signer);
    let allowance = await tokenIn.allowance(await signer.getAddress(), address);
    try {
        if (allowance > size) {
            return true;
        }
        let maxUintValue = ethers.MaxUint256;
        let approve = await tokenIn.approve(address, maxUintValue);
        await approve.wait(30);
    } catch (error: any) {
        console.log("error in checkApproval:");
        console.error(error);
        return true;
    }
    return false;
}
