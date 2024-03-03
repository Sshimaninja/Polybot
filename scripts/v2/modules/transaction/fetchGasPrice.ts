import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swapSingle } from "../../../../constants/environment";
import { debugAmounts } from "../../../../test/debugAmounts";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { walletBal } from "../tools/walletBal";
import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { debug } from "console";
import { ethers } from "hardhat";
import { pendingTransactions } from "../../control";
import { checkApproval } from "./approvals";
import { MaxInt256 } from "ethers";
import { swap } from "./swap";

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
    if (trade.type.includes("flash")) {
        logger.info("EstimatingGas for trade: " + trade.ticker + "...");
        try {
            // const fix = await fixEstimateGas(trade);
            // logger.info(fix);
            if (trade.wallet.token0Balance < trade.tradeSizes.pool0.token0.size) {
                logger.info("Insufficient balance for trade. Skipping trade.");
                return g;
            }
            if (pendingTransactions[trade.ID] == true) {
                logger.info("Pending transaction. Skipping trade.");
                return g;
            }
            pendingTransactions[trade.ID] == true;
            gasEstimate = await trade.flash.flashSwap.estimateGas(
                trade.loanPool.factory,
                trade.loanPool.router,
                trade.target.router,
                trade.tokenIn.data.id,
                trade.tokenOut.data.id,
                trade.tradeSizes.pool0.token0.size,
                trade.quotes.target.token1Out,
                trade.loanPool.amountRepay,
            );
            logger.info(">>>>>>>>>>gasEstimate SUCCESS: ", gasEstimate);
            let gasPrice = gasEstimate * trade.gas.maxFee;
            logger.info("GASLOGS: ", gasPrice);
            logger.info("GASESTIMATE SUCCESS::::::", fu(gasPrice, 18));
            pendingTransactions[trade.ID] == false;
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
                `>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<`,
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
            let p = await trade.params;
            if (p.amountOutB < p.tradeSize) {
                // logger.error("AmountOut TokenIn on LoanPool lower than tradeSize.");
                return g;
            }
            const profit = p.amountOutA - p.tradeSize;
            logger.info(
                "Profit in tokenIn: " + fu(profit, trade.tokenIn.data.decimals),
                trade.tokenIn.data.symbol,
            );
            // logger.info("Checking balances: ");
            const bal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
            // logger.info(bal);
            if (bal.tokenIn < trade.tradeSizes.pool0.token0.size) {
                logger.info(
                    "tokenIn Balance: ",
                    fu(bal.tokenIn, trade.tokenIn.data.decimals),
                    trade.tokenIn.data.symbol,
                );
                logger.info(
                    "tokenIn tradeSize: ",
                    fu(trade.tradeSizes.pool0.token0.size, trade.tokenIn.data.decimals),
                    trade.tokenIn.data.symbol,
                );
                logger.error("Token0 balance too low for trade.");
                return g;
            }
            let swapSingleAddress = await swapSingle.getAddress();
            if (pendingTransactions[trade.ID] == true) {
                logger.info("Pending gasEstimate. Skipping gasEstimate.");
                return g;
            }

            // await trade.tokenIn.contract.approve(swapSingleAddress, MaxInt256);
            // const allowanceSwapSingle = await trade.tokenIn.contract.allowance(
            //     await signer.getAddress(),
            //     swapSingleAddress,
            // );
            // await trade.tokenIn.contract.approve(p.routerAID, MaxInt256);
            // const allowanceTarget = await trade.tokenIn.contract.allowance(
            //     await signer.getAddress(),
            //     p.routerAID,
            // );
            // await trade.target.router.approve;
            // console.log(
            //     "Allowance for swapSingle: ",
            //     allowanceSwapSingle,
            //     trade.tokenIn.data.symbol,
            //     "Allowance for target: ",
            //     allowanceTarget,
            //     trade.tokenIn.data.symbol,
            // );

            // await trade.target.pool.approve(await trade.target.router.getAddress(), MaxInt256);

            // let targetAllowance = await trade.target.pool.allowance(
            //     await signer.getAddress(),
            //     p.routerAID,
            // );
            // const tokenContract = new ethers.Contract(trade.target.pool, IERC20, signer);

            // why 0n?:
            // [2024-03-03T22:19:18.950] [INFO] default - TargetAllowanceTokenIn:  57896044618658097711785492504343953926634992332820282019728792003956564819967n DAI
            // [2024-03-03T22:19:18.950] [INFO] default - TargetAllowanceTokenOut:  0n WMATIC
            // [2024-03-03T22:19:18.951] [INFO] default - TargetAllowanceTokenIn:  57896044618658097711785492504343953926634992332820282019728792003956564819967n DAI
            // [2024-03-03T22:19:18.951] [INFO] default - TargetAllowanceTokenOut:  3569124090114451318145n WMATIC

            await trade.tokenIn.contract.approve(await trade.target.router.getAddress(), MaxInt256);
            let allowanceTokenIn = await trade.tokenIn.contract.allowance(
                await signer.getAddress(),
                await trade.target.router.getAddress(),
            );
            let allowanceTokenOut = await trade.tokenOut.contract.allowance(
                await signer.getAddress(),
                await trade.target.router.getAddress(),
            );
            logger.info("TargetAllowanceTokenIn: ", allowanceTokenIn, trade.tokenIn.data.symbol);
            logger.info("TargetAllowanceTokenOut: ", allowanceTokenOut, trade.tokenOut.data.symbol);
            gasEstimate = await swapSingle.swapSingle.estimateGas(
                p.target,
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
            pendingTransactions[trade.ID] == false;
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
                    // data,
                    // `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`,
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
