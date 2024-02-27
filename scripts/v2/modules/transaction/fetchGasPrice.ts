import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
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
            // Helpful for figuring out how to determine and display gas prices:
            // const gasLogs = {
            //     gasEstimate: gasEstimate,
            //     gasPrice: fu(maxFee + maxPriorityFee * BigInt(10), 18),
            //     maxFee: fu(maxFee, 18),
            //     maxPriorityFee: fu(maxPriorityFee, 18),
            //     gasLimit: fu(gasEstimate, 18),
            //     gasEstimateTimesMaxFee: fu(gasEstimate * maxFee, 18),
            //     gasEstimateTimesMaxPriorityFee: fu(gasEstimate * maxPriorityFee, 18),
            //     gasEstimateTimesMaxFeePlusMaxPriorityFee: fu(
            //         gasEstimate * (maxFee + maxPriorityFee),
            //         18,
            //     ),
            //     gasEstimateTimesMaxFeePlusMaxPriorityFeeTimes10: fu(
            //         (gasEstimate * (maxFee + maxPriorityFee) + maxFee) * BigInt(10),
            //         18,
            //     ),
            // };
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
            const tx = await trade.flash.swapSingle.estimateGas(
                trade.loanPool.router,
                trade.target.router,
                trade.target.tradeSize,
                trade.quotes.loanPool.out,
                trade.quotes.target.out,
                [trade.tokenIn.id, trade.tokenOut.id],
                [trade.tokenOut.id, trade.tokenIn.id],
                signer.address,
                deadline,
            );

            //     address router0,
            //     address router1,
            //     address token0ID,
            //     address token1ID,
            //     uint256 amountIn,
            //     uint256 amountOut0,
            //     uint256 amountOut1,
            //     address[] memory path0,
            //     address[] memory path1,
            //     address to,
            //     uint256 deadline

            // trade.loanPool.factory,
            // trade.loanPool.router,
            // trade.target.router,
            // trade.tokenIn.id,
            // trade.tokenOut.id,
            // trade.target.tradeSize,
            // trade.quotes.target.flashOut,
            // trade.loanPool.amountRepay,

            // {
            //   "inputs": [
            //     {
            //       "internalType": "uint256",
            //       "name": "amountIn",
            //       "type": "uint256"
            //     },
            //     {
            //       "internalType": "uint256",
            //       "name": "amountOutMin",
            //       "type": "uint256"
            //     },
            //     {
            //       "internalType": "address[]",
            //       "name": "path",
            //       "type": "address[]"
            //     },
            //     {
            //       "internalType": "address",
            //       "name": "to",
            //       "type": "address"
            //     },
            //     {
            //       "internalType": "uint256",
            //       "name": "deadline",
            //       "type": "uint256"
            //     }
            //   ],
            //   "name": "swapExactTokensForTokens",
            //   "outputs": [
            //     {
            //       "internalType": "uint256[]",
            //       "name": "amounts",
            //       "type": "uint256[]"
            //     }
            //   ],
            //   "stateMutability": "nonpayable",
            //   "type": "function"
            // },

            // let tx = {
            //     from: signer,
            //     to: trade.target.router,
            //     value: 0,
            //     data: await trade.target.router.swapExactTokensForTokens(
            //         trade.target.tradeSize,
            //         trade.quotes.target.flashOut,
            //         trade.tokenIn.id,
            //         trade.tokenOut.id,
            //         deadline,
            //     ),
            // };
            gasEstimate = await signer.estimateGas(tx);
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
