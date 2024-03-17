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
import { MaxInt256 } from "ethers";
import { swap } from "./swap";
import {} from "../../../../utils/approvals";

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
                trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
                trade.quotes.target.tokenOutOut,
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
        let p = await trade.params;
        try {
            if (p.amountOutB < p.tradeSize) {
                // logger.error("AmountOut TokenIn on LoanPool lower than tradeSize.");
                return g;
            }

            const profit = p.amountOutA - trade.quotes.loanPool.tokenOutOut;

            // logger.info(
            //     "Profit in tokenIn: " + fu(profit, trade.tokenOut.data.decimals),
            //     trade.tokenOut.data.symbol,
            // );

            const bal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);

            if (bal.tokenIn < trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
                logger.info(
                    "tokenIn Balance: ",
                    fu(bal.tokenIn, trade.tokenIn.data.decimals),
                    trade.tokenIn.data.symbol,
                );
                logger.info(
                    "tokenIn tradeSize: ",
                    fu(
                        trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
                        trade.tokenIn.data.decimals,
                    ),
                    trade.tokenIn.data.symbol,
                );
                logger.error("Token0 balance too low for trade.");
                return g;
            }

            let routerApproval = await trade.tokenIn.contract.allowance(
                await signer.getAddress(),
                p.routerAID,
            );
            let swapApproval = await trade.tokenIn.contract.allowance(
                await signer.getAddress(),
                swapSingle.getAddress(),
            );
            if (routerApproval < p.tradeSize) {
                logger.info("RouterA allowance: ", fu(routerApproval, 18));
                logger.error("RouterA allowance too low for trade.");
                logger.info("Approving RouterA... ");
                try {
                    if (trade.tokenIn.data.symbol === "QUICK") {
                        let maxInt = 2n ** 96n - 1n;
                        await trade.tokenIn.contract.approve(p.routerAID, maxInt);
                    }
                    await trade.tokenIn.contract.approve(p.routerAID, MaxInt256);
                } catch (e: any) {
                    logger.error("[fetchGasPrice (routerApproval): ", e.reason);
                }
                return g;
            }
            if (swapApproval < p.tradeSize) {
                logger.info("swapSingle allowance: ", fu(swapApproval, 18));
                logger.error("swapSingle allowance too low for trade.");
                try {
                    if (trade.tokenIn.data.symbol === "QUICK") {
                        let maxInt = 2n ** 96n - 1n;
                        await trade.tokenIn.contract.approve(swapSingle.getAddress(), maxInt);
                    }
                    swapApproval = await trade.tokenIn.contract.approve(
                        swapSingle.getAddress(),
                        MaxInt256,
                    );
                } catch (e: any) {
                    logger.error("[fetchGasPrice (swapContractApproval)]: ", e.reason);
                }
                return g;
            }
            // const swapSingleAddress = await swapSingle.getAddress();

            if (pendingTransactions[trade.ID] == true) {
                logger.info("Pending gasEstimate. Skipping gasEstimate.");
                return g;
            }

            let walletBalance = {
                walletID: await signer.getAddress(),
                tokenIn: fu(bal.tokenIn, trade.tokenIn.data.decimals),
                tokenOut: fu(bal.tokenOut, trade.tokenOut.data.decimals),
                gas: fu(bal.gas, 18),
            };
            // logger.info("walletBalance: ");
            // logger.info(walletBalance);
            // let tradeData = {
            //     tradeSize: fu(p.tradeSize, trade.tokenIn.data.decimals),
            // };
            // logger.info("tradeData: ");
            // logger.info(tradeData);

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
            // logger.info(">>>>>>>>>>swapSingle gasEstimate SUCCESS: ", gasEstimate);
            let gasPrice = gasEstimate * trade.gas.maxFee;
            // logger.info("swapSingle GASLOGS: ", gasPrice);
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
                    `>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${
                        trade.loanPool.exchange + trade.target.exchange
                    } ${trade.type} ${error.reason} <<<<<<<<<<<<<<<`,
                    // error.reason,
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
