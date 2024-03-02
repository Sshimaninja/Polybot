import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swapSingle } from "../../../../constants/environment";
import { debugAmounts } from "../../../../test/debugAmounts";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { walletBal } from "../tools/walletBal";
import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { debug } from "console";
import { ethers } from "hardhat";
import { pendingTransactions } from "../../control";
import { checkApproval } from "./approvals";

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
        trade.type === "flashMultI" ||
        trade.type === "flashSingle"
        // trade.type.includes("filtered")
    ) {
        logger.info("EstimatingGas for trade: " + trade.ticker + "...");
        try {
            // const fix = await fixEstimateGas(trade);
            // logger.info(fix);
            if (trade.wallet.tokenInBalance < trade.target.tradeSize.token0.size) {
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
                trade.tokenIn.id,
                trade.tokenOut.id,
                trade.target.tradeSize,
                trade.quotes.target.token1,
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
        let nonce = await signer.getNonce();

        try {
            const p = {
                routerAID: await trade.target.router.getAddress(), //high Output tokenIn to tokenOut
                routerBID: await trade.loanPool.router.getAddress(), //high Output tokenOut to tokenIn
                tradeSize: trade.wallet.tokenInBalance,
                amountOutA: trade.quotes.target.token1, //high Output tokenIn to tokenOut
                amountOutB: trade.quotes.loanPool.token0, //high Output tokenOut to tokenIn
                path0: [trade.tokenIn.id, trade.tokenOut.id],
                path1: [trade.tokenOut.id, trade.tokenIn.id],
                to: await signer.getAddress(),
                deadline: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
            };

            if (p.amountOutB < p.tradeSize) {
                logger.error("AmountOut TokenIn on LoanPool lower than tradeSize.");
                return g;
            }
            const profit = p.amountOutB - p.tradeSize;
            logger.info("Profit in tokenIn: " + fu(profit, trade.tokenIn.decimals));
            // logger.info("Checking balances: ");
            const bal = await walletBal(trade.tokenIn, trade.tokenOut);
            // logger.info(bal);
            if (bal.tokenIn < trade.target.tradeSize.token0.size) {
                logger.info(
                    "tokenIn Balance: ",
                    fu(bal.tokenIn, trade.tokenIn.decimals),
                    trade.tokenIn.symbol,
                );
                logger.info(
                    "tokenIn tradeSize: ",
                    fu(trade.target.tradeSize.token0.size, trade.tokenIn.decimals),
                    trade.tokenIn.symbol,
                );
                logger.error("Token0 balance too low for trade.");
                return g;
            }
            let swapSingleAddress = await swapSingle.getAddress();
            if (pendingTransactions[trade.ID] == true) {
                logger.info("Pending gasEstimate. Skipping gasEstimate.");
                return g;
            }
            pendingTransactions[trade.ID] == true;
            let approveTokenIn = await checkApproval(
                trade.tokenIn.id,
                swapSingleAddress,
                trade.target.tradeSize.token0.size,
            );
            let approveTokenOut = await checkApproval(
                trade.tokenOut.id,
                swapSingleAddress,
                trade.quotes.target.token1,
            );
            if (!approveTokenIn || !approveTokenOut) {
                logger.info(">>>>>>>>>>>>>>>>>>>>>ERROR: APPROVAL FAILED");
                return g;
            }
            logger.info("tokenIn approved: ", approveTokenIn);
            logger.info("tokenOut approved: ", approveTokenOut);

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
