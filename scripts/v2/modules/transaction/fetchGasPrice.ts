import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swapSingle } from "../../../../constants/environment";
import { fixEstimateGas } from "../../../../test/fixEstimateGas";

/**
 * @param trade
 * @returns gas estimate and gas price for a given trade.
 * If the gasEstimate fails, it will return a default gas estimate of 300000.
 * @returns gasData: { gasEstimate: bigint, gasPrice: bigint, maxFee: number, maxPriorityFee: number }
 */
export async function fetchGasPrice(trade: BoolTrade): Promise<GAS> {
    // Commented out for now to elimiate from testing & debugging:

    const maxFeeGasData = trade.gas.maxFee; //150 is placeholder until gasData works.
    // console.log('maxFeeGasData: ', maxFeeGasData)

    const maxPriorityFeeGasData = trade.gas.maxPriorityFee; //60 is placeholder until gasData works.
    // console.log('maxPriorityFeeGasData: ', maxPriorityFeeGasData)

    // const maxFee = BigInt(Math.trunc(maxFeeGasData * 10 ** 9));
    // // console.log('maxFeeString: ', maxFeeString)

    // const maxPriorityFee = BigInt(Math.trunc(maxPriorityFeeGasData * 10 ** 9));
    // console.log('maxPriorityFeeString: ', maxPriorityFeeString

    let gasEstimate = BigInt(30000000);

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
            //loanPool: 1000/1 WMATIC/ETH
            //target: 1100/1 WMATIC/ETH
            const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes
            gasEstimate = await swapSingle.swapSingle.estimateGas(
                trade.loanPool.router,
                trade.target.router,
                trade.target.tradeSize,
                trade.quotes.loanPool.out,
                trade.quotes.target.out,
                [trade.tokenIn.id, trade.tokenOut.id],
                [trade.tokenOut.id, trade.tokenIn.id],
                await signer.getAddress(),
                deadline,
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
