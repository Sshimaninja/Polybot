import { BoolTrade } from "../../../../constants/interfaces";
import { signer } from "../../../../constants/provider";

export async function params(trade: BoolTrade): Promise<any> {
    let p: any = {};
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
            tradeSize: trade.tradeSizes.pool0.token0.size,
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
            amountIn: trade.tradeSizes.pool0.token0.size,
            amountOut: trade.quotes.target.token1Out,
            amountToRepay: trade.loanPool.amountRepay,
        };
    }
    return p;
}
