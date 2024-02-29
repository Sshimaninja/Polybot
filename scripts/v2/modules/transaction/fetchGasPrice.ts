import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swapSingle } from "../../../../constants/environment";
import { debugAmounts } from "../../../../test/debugAmounts";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { checkBal } from "../tools/checkBal";
import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { debug } from "console";
import { ethers } from "hardhat";

/**
 * @param trade
 * @returns gas estimate and gas price for a given trade.
 * If the gasEstimate fails, it will return a default gas estimate of 300000.
 * @returns gasData: { gasEstimate: bigint, gasPrice: bigint, maxFee: number, maxPriorityFee: number }
 */
export async function fetchGasPrice(trade: BoolTrade): Promise<GAS> {
    const maxFeeGasData = trade.gas.maxFee;

    const maxPriorityFeeGasData = trade.gas.maxPriorityFee;

    let gasEstimate = BigInt(30000000);

    let g: GAS = {
        gasEstimate,
        tested: false,
        gasPrice: trade.gas.gasPrice,
        maxFee: maxFeeGasData,
        maxPriorityFee: maxPriorityFeeGasData,
    };
    if (
        trade.type === "flashMult" ||
        trade.type === "flashSingle" ||
        trade.type.includes("filtered")
    ) {
        console.log("EstimatingGas for trade: " + trade.ticker + "...");
        try {
            // const fix = await fixEstimateGas(trade);
            // console.log(fix);

            gasEstimate = await trade.flash.flashSwap.estimateGas(
                trade.loanPool.factory,
                trade.loanPool.router,
                trade.target.router,
                trade.tokenIn.id,
                trade.tokenOut.id,
                trade.target.tradeSize,
                trade.quotes.target.flashOut,
                trade.loanPool.amountRepay,
            );
            console.log(">>>>>>>>>>gasEstimate SUCCESS: ", gasEstimate);
            let gasPrice = gasEstimate * trade.gas.maxFee;
            console.log("GASLOGS: ", gasPrice);
            console.log("GASESTIMATE SUCCESS::::::", fu(gasPrice, 18));
            return {
                gasEstimate,
                tested: true,
                gasPrice,
                maxFee: trade.gas.maxFee,
                maxPriorityFee: trade.gas.maxPriorityFee,
            };
        } catch (error: any) {
            const data = await tradeLogs(trade);
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`,
            );
            return {
                gasEstimate,
                tested: false,
                gasPrice: trade.gas.gasPrice,
                maxFee: maxFeeGasData,
                maxPriorityFee: maxPriorityFeeGasData,
            };
        }
    }
    // Calculation for single trade is easier since it doesn't require a custom contract.
    if (trade.type === "single") {
        try {
            //loanPool: 1000/1.0 WMATIC/ETH
            //target: 1000/1.2 WMATIC/ETH
            // 1.2 ETH to loanPool = 1.2 * 1000 = 1200 WMATIC = 200 WMATIC profit

            // address routerAID,
            // address routerBID,
            // uint256 tradeSize,
            // uint256 amountOutA,
            // uint256 amountOutB,
            // address[] memory path0,
            // address[] memory path1,
            // address to,
            // uint256 deadline
            // let a = await debugAmounts(trade);

            // console.log(a);

            const p = {
                routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
                routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
                tradeSize: trade.target.tradeSize.size,
                amountOutA: trade.quotes.target.out, //high Output tokenIn to tokenOut
                amountOutB: trade.quotes.loanPool.in, //high Output tokenOut to tokenIn
                path0: [trade.tokenIn.id, trade.tokenOut.id],
                path1: [trade.tokenOut.id, trade.tokenIn.id],
                to: await signer.getAddress(),
                deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
            };
            if (p.amountOutB < p.tradeSize) {
                // logger.error("AmountOut TokenIn on LoanPool lower than tradeSize.");
                return g;
            }
            const profit = p.amountOutB - p.tradeSize;
            console.log("Profit in tokenIn: " + fu(profit, trade.tokenIn.decimals));
            // logger.info("Checking balances: ");
            const bal = await checkBal(trade.tokenIn, trade.tokenOut);
            // logger.info(bal);
            if (bal.token0 < trade.target.tradeSize.size) {
                logger.error("Token0 balance too low for trade.");
                return g;
            }
            let swapSingleAddress = await swapSingle.getAddress();
            let tokenIn = new ethers.Contract(p.path0[0], IERC20, signer);
            await tokenIn.approve(swapSingleAddress, p.tradeSize);
            gasEstimate = await swapSingle.swapSingle.estimateGas(
                p.routerAID,
                p.routerBID,
                p.tradeSize,
                p.amountOutA,
                p.amountOutB,
                p.path0,
                p.path1,
                p.to,
                p.deadline,
            );
            logger.info(">>>>>>>>>>swapSingle gasEstimate SUCCESS: ", gasEstimate);
            let gasPrice = gasEstimate * trade.gas.maxFee;
            logger.info("swapSingle GASLOGS: ", gasPrice);
            logger.info("swapSingle GASESTIMATE SUCCESS::::::", fu(gasPrice, 18));
            return {
                gasEstimate,
                tested: true,
                gasPrice,
                maxFee: trade.gas.maxFee,
                maxPriorityFee: trade.gas.maxPriorityFee,
            };
        } catch (error: any) {
            if (error.message.includes("Nonce too high")) {
                logger.error("Nonce too high. Skipping trade.");
                return g;
            } else {
                const data = await tradeLogs(trade);
                logger.error(
                    `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`,
                    error,
                    data,
                    `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`,
                );
                return g;
            }
        }
    } else {
        return {
            gasEstimate,
            tested: false,
            gasPrice: BigInt(150n + 60n * gasEstimate),
            maxFee: maxFeeGasData,
            maxPriorityFee: maxPriorityFeeGasData,
        };
    }
}

/*
	GAS EXAMPLE FROM ETHERS.JS ^6.0.0:
	lastBaseFeePerGas = block.baseFeePerGas;
	maxPriorityFeePerGas = BigInt("1500000000");
	maxFeePerGas = block.baseFeePerGas * (2) + (maxPriorityFeePerGas);
*/
