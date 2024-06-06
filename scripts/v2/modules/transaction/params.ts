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
// function flashSwap(
//     address loanFactory,
//     address loanRouter,
//     address targetRouter,
//     address token0ID,
//     address token1ID,
//     uint256 amountIn,
//     uint256 amountOut,
//     uint256 amountToRepay
// ) external {
// key: 'flashSwap',
// args: [
//   '0xCf083Be4164828f00cAE704EC15a36D711491284',
//   '0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607',
//   '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
//   '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
//   '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
//   54897976877338564407n,
//   49646268824915942607n,
//   51739509899649324576n,
//   1712770840,
//   [Object]
// ]
