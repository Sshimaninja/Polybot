import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swap } from "../../../../constants/environment";
import { debugAmounts } from "../../../../test/debugAmounts";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { walletBal } from "../tools/walletBal";
// import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { debug } from "console";
import { ethers } from "hardhat";
import { pendingTransactions } from "../../control";
import { MaxInt256 } from "ethers";
import { safetyChecks } from "../transaction/safetyChecks";
import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { params } from "../transaction/params";

/**
 * @param trade
 * @returns gas estimate and gas price for a given trade.
 * If the g.gasEstimate fails, it will return a default gas estimate of 300000.
 * @returns gasData: { g.gasEstimate: bigint, gasPrice: bigint, maxFee: number, maxPriorityFee: number }
 */
export async function fetchGasPrice(trade: BoolTrade): Promise<GAS> {
    let g: GAS = {
        gasEstimate: trade.gas.gasEstimate,
        tested: false,
        gasPrice: trade.gas.gasPrice,
        maxFee: trade.gas.maxFee,
        maxPriorityFee: trade.gas.maxPriorityFee,
    };
    try {
        if (pendingTransactions[trade.ID] == true) {
            logger.info("Pending transaction. Skipping trade.");
            return g;
        }
        pendingTransactions[trade.ID] == true;
        const swap = await params(trade);
        const ps = swap.swapParams;
        const pf = swap.flashParams;
        if (trade.type.includes("flash")) {
            g.gasEstimate = await trade.contract.flashSwap.estimateGas(
                pf.loanFactory,
                pf.loanRouter,
                pf.targetRouter,
                pf.tokenInID,
                pf.tokenOutID,
                pf.amountIn,
                pf.amountOut,
                pf.amountToRepay,
            );
        }
        if (trade.type === "single" || trade.type === "multi") {
            g.gasEstimate = await trade.contract.swapSingle.estimateGas(
                ps.routerAID,
                ps.routerBID,
                ps.tradeSize,
                ps.amountOutA,
                ps.path0,
                ps.path1,
                ps.to,
                ps.deadline,
            );
        }
        logger.info(">>>>>>>>>>gasEstimate SUCCESS: ", g.gasEstimate);
        let gasPrice = g.gasEstimate * trade.gas.maxFee;
        logger.info("GASLOGS: ", gasPrice);
        logger.info("GASESTIMATE SUCCESS::::::", fu(gasPrice, 18));
        pendingTransactions[trade.ID] == false;
        return {
            gasEstimate: trade.gas.gasEstimate * 2n,
            tested: true,
            gasPrice: trade.gas.gasPrice * 2n,
            maxFee: trade.gas.maxFee * 2n,
            maxPriorityFee: trade.gas.maxPriorityFee * 2n,
        };
    } catch (error: any) {
        // const data = await tradeLogs(trade);
        logger.error(
            `>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} ${trade.type} ${error.reason} <<<<<<<<<<<<<<<<`,
            // error,
        );
        return {
            gasEstimate: trade.gas.gasEstimate * 2n,
            tested: false,
            gasPrice: trade.gas.gasPrice * 2n,
            maxFee: trade.gas.maxFee * 2n,
            maxPriorityFee: trade.gas.maxPriorityFee * 2n,
        };
    }
}
