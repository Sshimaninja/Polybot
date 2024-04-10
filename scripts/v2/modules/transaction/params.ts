import { BoolTrade } from "../../../../constants/interfaces";
import { signer } from "../../../../constants/provider";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";
import { swapID } from "../../../../constants/environment";
// import { checkApprovalRouter, checkApprovalSingle } from "../../../../utils/approvals";
import { fu } from "../../../modules/convertBN";
import { logger } from "../../../../constants/logger";
import { approve } from "./approve";

export interface PSwap {
    routerAID: string;
    routerBID: string;
    tradeSize: bigint;
    amountOutA: bigint;
    path0: string[];
    path1: string[];
    to: string;
    deadline: number;
}

export interface PFlash {
    loanFactory: string;
    loanRouter: string;
    targetRouter: string;
    tokenInID: string;
    tokenOutID: string;
    amountIn: bigint;
    amountOut: bigint;
    amountToRepay: bigint;
    deadline: number;
}

export async function params(trade: BoolTrade): Promise<{
    swap: Promise<ethers.ContractTransaction>;
    swapParams: PSwap;
    flashParams: PFlash;
}> {
    const d = Math.floor(Date.now() / 1000) + 60 * 1; // 1 minute
    let p: PSwap = {
        routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
        routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
        tradeSize: trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
        amountOutA: trade.quotes.target.tokenOutOut, //high Output tokenIn to tokenOut
        path0: [trade.tokenIn.data.id, trade.tokenOut.data.id],
        path1: [trade.tokenOut.data.id, trade.tokenIn.data.id],
        to: await signer.getAddress(),
        deadline: d,
    };
    let pf: PFlash = {
        loanFactory: await trade.loanPool.factory.getAddress(),
        loanRouter: await trade.loanPool.router.getAddress(),
        targetRouter: await trade.target.router.getAddress(),
        tokenInID: trade.tokenIn.data.id,
        tokenOutID: trade.tokenOut.data.id,
        amountIn: trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
        amountOut: trade.quotes.target.tokenOutOut,
        amountToRepay: trade.loanPool.amountRepay,
        deadline: d,
    };
    let swap: Promise<ethers.ContractTransaction> =
        {} as Promise<ethers.ContractTransaction>;
    if (trade.type == "single") {
        swap = trade.contract.swapSingle.populateTransaction(
            p.routerAID,
            p.routerBID,
            p.tradeSize,
            p.amountOutA,
            p.path0,
            p.path1,
            p.to,
            p.deadline,
            {
                Type: 2,
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
            },
        );
    }
    if (trade.type == "multi") {
        swap = trade.contract.swapMulti.populateTransaction(
            p.routerAID,
            p.routerBID,
            p.tradeSize,
            p.amountOutA,
            p.path0,
            p.path1,
            p.to,
            p.deadline,
            {
                Type: 2,
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
            },
        );
    }
    if (trade.type.includes("flash")) {
        swap = trade.contract.flashSwap.populateTransaction(
            pf.loanFactory,
            pf.loanRouter,
            pf.targetRouter,
            pf.tokenInID,
            pf.tokenOutID,
            pf.amountIn,
            pf.amountOut,
            pf.amountToRepay,
            pf.deadline,
            {
                Type: 2,
                gasLimit: trade.gas.gasEstimate,
                maxFeePerGas: trade.gas.maxFee,
                maxPriorityFeePerGas: trade.gas.maxPriorityFee,
            },
        );
    }
    return { swap, swapParams: p, flashParams: pf };
}
