import { BoolTrade } from "../../../../constants/interfaces";
import { signer } from "../../../../constants/provider";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";
import { swapSingleID } from "../../../../constants/environment";
import { checkApprovalRouter, checkApprovalSingle } from "./approvals";
import { fu } from "../../../modules/convertBN";

export async function params(trade: BoolTrade): Promise<any> {
    let p: any = {};
    // Create a new Contract instance for the token

    // Check the balance and allowance
    // let ownerID = await signer.getAddress();
    // let targetRouterID = await trade.target.router.getAddress();
    const walletBalanceTokenIn = await trade.tokenIn.contract.balanceOf(await signer.getAddress());
    // const routerAllowanceTokenIn = await trade.tokenIn.contract.allowance(ownerID, targetRouterID);
    if (trade.type == "single") {
        const swapSingleAllowanceTokenIn = await trade.tokenIn.contract.allowance(
            await signer.getAddress(),
            swapSingleID,
        );
        const routerAllowanceTokenIn = await trade.tokenIn.contract.allowance(
            await signer.getAddress(),
            await trade.target.router.getAddress(),
        );
        if (walletBalanceTokenIn < trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
            throw new Error(
                "[params]: Insufficient balance for the trade. Balance: " +
                    fu(walletBalanceTokenIn, trade.tokenIn.data.decimals) +
                    " tradeSize: " +
                    trade.tradeSizes.loanPool.tradeSizeTokenIn.size +
                    " " +
                    trade.tokenIn.data.symbol,
            );
        }
        console.log(
            "[params]: wallet balance tokenIn::: ",
            fu(walletBalanceTokenIn, trade.tokenIn.data.decimals),
            trade.tokenIn.data.symbol,
        );
        console.log(
            "[params]: router allowance tokenIn: ",
            fu(routerAllowanceTokenIn, trade.tokenIn.data.decimals),
            trade.tokenIn.data.symbol,
        );
        console.log(
            "[params]: swapSingle allowance tokenIn: " +
                fu(swapSingleAllowanceTokenIn, trade.tokenIn.data.decimals) +
                " " +
                trade.tokenIn.data.symbol,
        );
        p = {
            target: await trade.target.pool.getAddress(),
            routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
            routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
            tradeSize: trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            amountOutA: trade.quotes.target.token1Out, //high Output tokenIn to tokenOut
            amountOutB: trade.quotes.loanPool.token0Out, //high Output tokenOut to tokenIn
            path0: [trade.tokenIn.data.id, trade.tokenOut.data.id],
            path1: [trade.tokenOut.data.id, trade.tokenIn.data.id],
            to: await signer.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes}
        };
    }

    if (trade.type.includes("flash")) {
        // console.log(
        //     "[params]: loanPoolBalance: " +
        //         trade.loanPool.reserveIn +
        //         " " +
        //         trade.tokenIn.data.symbol,
        // );

        p = {
            loanFactory: trade.loanPool.factory,
            loanRouter: trade.loanPool.router,
            targetRouter: trade.target.router,
            token0ID: trade.tokenIn.data.id,
            token1ID: trade.tokenOut.data.id,
            amountIn: trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            amountOut: trade.quotes.target.token1Out,
            amountToRepay: trade.loanPool.amountRepay,
        };
    }
    return p;
}
