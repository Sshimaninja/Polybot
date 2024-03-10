import { ethers, Transaction, TransactionRequest } from "ethers";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { signer } from "../../../../constants/provider";
import { BoolTrade } from "../../../../constants/interfaces";
import { swapSingleID } from "../../../../constants/environment";

async function approveToken(
    tokenAddress: string,
    spender: string,
    amount: bigint,
): Promise<bigint> {
    const token = new ethers.Contract(tokenAddress, IERC20, signer);
    const ownerAddress = await signer.getAddress();
    const allowance: bigint = await token.allowance(ownerAddress, spender);
    const maxInt = ethers.MaxInt256;
    try {
        if (allowance > amount) {
            // console.log(`Already approved ${tokenAddress} for ${spender} for: ${allowance}`);
            return allowance;
        }

        const approvalTx: TransactionRequest = await token.approve(spender, maxInt);
        const receipt = await signer.sendTransaction(approvalTx);

        if (receipt.hash) {
            // console.log(`Approved ${tokenAddress} for ${spender}: ${receipt.hash}`);
            return await token.allowance(ownerAddress, spender);
        }
    } catch (error: any) {
        console.error(`Error in token approval for ${tokenAddress}:`, error.message);
        return await token.allowance(await signer.getAddress(), spender);
    }
    return await token.allowance(await signer.getAddress(), spender);
}

export async function checkApprovalRouter(trade: BoolTrade): Promise<bigint> {
    const maxInt = ethers.MaxInt256;
    const routerAddress = await trade.target.router.getAddress();

    const approveTokenInForRouter = await approveToken(
        trade.tokenIn.data.id,
        routerAddress,
        trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
    );

    return approveTokenInForRouter; //&& approveTokenInForSwapContract;
}

export async function checkApprovalSingle(trade: BoolTrade): Promise<bigint> {
    if (
        (await trade.tokenIn.contract.allowance(
            await signer.getAddress(),
            await trade.target.router.getAddress(),
        )) > trade.tradeSizes.loanPool.tradeSizeTokenIn.size
    ) {
        const maxInt = ethers.MaxInt256;
        const swapContractID = swapSingleID;

        const approveTokenInForRouter = await approveToken(
            trade.tokenIn.data.id,
            swapContractID,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
        );
        return approveTokenInForRouter;
    }
    return 0n; //&& approveTokenInForSwapContract;
}
