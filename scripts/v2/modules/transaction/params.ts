import { BoolTrade } from "../../../../constants/interfaces";
import { signer } from "../../../../constants/provider";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";

export async function params(trade: BoolTrade): Promise<any> {
    let p: any = {};
    // Create a new Contract instance for the token
    const tokenContract = new ethers.Contract(trade.tokenIn.data.id, IERC20, signer);

    // Check the balance and allowance
    const balance = await tokenContract.balanceOf(await signer.getAddress());
    const allowance = await tokenContract.allowance(
        await signer.getAddress(),
        await trade.target.router.getAddress(),
    );

    if (balance < trade.tradeSizes.loanPool.tradeSizeToken0.size) {
        throw new Error(
            "[params]: Insufficient balance for the trade. Balance: " +
                balance +
                " tradeSize: " +
                trade.tradeSizes.loanPool.tradeSizeToken0.size +
                " " +
                trade.tokenIn.data.symbol,
        );
    }

    if (allowance < trade.tradeSizes.loanPool.tradeSizeToken0.size) {
        console.log("[params]: Insufficient allowance for the trade. Approving more tokens...");

        // Approve the maximum possible amount of tokens
        const maxUint256 = ethers.MaxUint256;
        try {
            const approveTx = await tokenContract.approve(
                await trade.target.router.getAddress(),
                maxUint256,
            );
            await approveTx.wait(); // Wait for the transaction to be mined
        } catch (error: any) {
            throw new Error("[params]: Failed to approve tokens: " + error.message);
        }

        console.log("[params]: Successfully approved tokens for the trade.");
    }

    if (trade.type == "single") {
        // address target,
        // address routerAID,
        // address routerBID,
        // uint256 tradeSize,
        // uint256 amountOutA,
        // uint256 amountOutB,
        // address[] memory path0,
        // address[] memory path1,
        // address to,
        // uint256 deadline
        p = {
            target: await trade.target.pool.getAddress(),
            routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
            routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
            tradeSize: trade.tradeSizes.loanPool.tradeSizeToken0.size,
            amountOutA: trade.quotes.target.token1Out, //high Output tokenIn to tokenOut
            amountOutB: trade.quotes.loanPool.token0Out, //high Output tokenOut to tokenIn
            path0: [trade.tokenIn.data.id, trade.tokenOut.data.id],
            path1: [trade.tokenOut.data.id, trade.tokenIn.data.id],
            to: await signer.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes}
        };
    }
    if (trade.type.includes("flash")) {
        p = {
            loanFactory: trade.loanPool.factory,
            loanRouter: trade.loanPool.router,
            targetRouter: trade.target.router,
            token0ID: trade.tokenIn.data.id,
            token1ID: trade.tokenOut.data.id,
            amountIn: trade.tradeSizes.loanPool.tradeSizeToken0.size,
            amountOut: trade.quotes.target.token1Out,
            amountToRepay: trade.loanPool.amountRepay,
        };
    }
    return p;
}
