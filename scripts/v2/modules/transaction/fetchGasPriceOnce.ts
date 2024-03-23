// import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
// import { tradeLogs } from "../tradeLog";
// import { logger } from "../../../../constants/logger";
// import { fu, pu } from "../../../modules/convertBN";
// import { ownerID, signer } from "../../../../constants/provider";
// import {
//     swapSingle,
//     flashMulti,
//     wmatic,
//     usdc,
// } from "../../../../constants/environment";
// import {
//     uniswapV2Exchange,
//     uniswapV2Router,
// } from "../../../../constants/addresses";
// import { debugAmounts } from "../../../../test/debugAmounts";
// import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
// import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
// import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
// import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
// import { walletBal } from "../tools/walletBal";
// // import { fixEstimateGas } from "../../../../test/fixEstimateGas";
// import { debug } from "console";
// import { ethers } from "hardhat";
// import { getGasData } from "../getPolygonGasPrices";
// import { pendingTransactions } from "../../control";
// import { MaxInt256 } from "ethers";
// import { safetyChecks } from "./safetyChecks";
// import { AmountConverter } from "../../classes/AmountConverter";
// import { getAmountsIn, getAmountsOut } from "../price/getAmountsIOJS";

// /**
//  * @param trade
//  * @returns gas estimate and gas price for a given
//  * If the gasEstimate fails, it will return a default gas estimate of 300000.
//  * @returns gasData: { gasEstimate: bigint, gasPrice: bigint, maxFee: number, maxPriorityFee: number }
//  */
// export async function fetchGasPriceOnce(gas: GasData): Promise<GAS> {
//     const quickRouter = new ethers.Contract(
//         uniswapV2Router.QUICK,
//         IUniswapV2Router02,
//         signer,
//     );
//     const quickFactory = new ethers.Contract(
//         uniswapV2Exchange.QUICK.factory,
//         IUniswapV2Factory,
//         signer,
//     );

//     const sushiRouter = new ethers.Contract(
//         uniswapV2Router.SUSHI,
//         IUniswapV2Router02,
//         signer,
//     );

//     const maxFeeGasData = gas.maxFee;

//     const maxPriorityFeeGasData = gas.maxPriorityFee;

//     let g: GAS = {
//         gasEstimate: gas.gasEstimate,
//         tested: false,
//         gasPrice: gas.gasPrice,
//         maxFee: maxFeeGasData,
//         maxPriorityFee: maxPriorityFeeGasData,
//     };
//     const defaultGas = g.gasEstimate * gas.maxFee;
//     // in order to only call this once, this is called on a single known high liq pool once per block.
//     try {
//         let amountOut = await getAmountsOut(sushiRouter, 10n, [
//             await wmatic.getAddress(),
//             await usdc.getAddress(),
//         ]);
//         // let amountRepay = await getAmountsIn(quickRouter, amountOut, [
//         //     await usdc.getAddress(),
//         //     await wmatic.getAddress(),
//         // ]);
//         g.gasEstimate = await swapSingle.swapSingle.estimateGas(
//             // p.target,
//             quickRouter,
//             sushiRouter,
//             100n,
//             0, //p.amountOutA,
//             0, //p.amountOutB,
//             [wmatic, usdc],
//             [usdc, wmatic],
//             ownerID,
//             Math.floor(Date.now() / 1000) + 60 * 1, // 1 minute
//         );
//         // g.gasEstimate = await flashMulti.flashSwap.estimateGas(
//         //     quickFactory,
//         //     quickRouter,
//         //     sushiRouter,
//         //     wmatic,
//         //     usdc,
//         //     10n, // tradeSizes.loanPool.tradeSizeTokenIn.size,
//         //     amountOut, // quotes.target.tokenOutOut,
//         //     amountRepay, // loanPool.amountRepay,
//         // );
//         let gasPrice = g.gasEstimate * gas.maxFee;
//         // logger.info("GASLOGS: ", gasPrice);
//         logger.info("GASESTIMATE::::::", fu(gasPrice, 18));
//         logger.info("DEFAULT GAS::::::", fu(defaultGas, 18));
//         return {
//             gasEstimate: g.gasEstimate,
//             tested: true,
//             gasPrice,
//             maxFee: gas.maxFee,
//             maxPriorityFee: gas.maxPriorityFee,
//         };
//     } catch (error: any) {
//         // const data = await tradeLogs(trade);
//         logger.error(
//             `>>>>>>>>>>Error in fetchGasPriceOnce: ${error.reason} <<<<<<<<<<<<<<<<`,
//             error,
//         );
//         return g;
//     }
// }
// // if (type.includes("flash")) {
// //     logger.info("EstimatingGas for trade: " + ticker + "...");
// //     try {
// //         // const fix = await fixEstimateGas(trade);
// //         // logger.info(fix);

// //         if (pendingTransactions[ID] == true) {
// //             logger.info("Pending transaction. Skipping ");
// //             return g;
// //         }
// //         pendingTransactions[ID] == true;
// //         gasEstimate = await flash.flashSwap.estimateGas(
// //             loanPool.factory,
// //             loanPool.router,
// //             target.router,
// //             tokenIn.data.id,
// //             tokenOut.data.id,
// //             1, // tradeSizes.loanPool.tradeSizeTokenIn.size,
// //             0, // quotes.target.tokenOutOut,
// //             loanPool.amountRepay,
// //         );
// //         logger.info(">>>>>>>>>>gasEstimate SUCCESS: ", gasEstimate);
// //         let gasPrice = gasEstimate * gas.maxFee;
// //         logger.info("GASLOGS: ", gasPrice);
// //         logger.info("GASESTIMATE SUCCESS::::::", fu(gasPrice, 18));
// //         pendingTransactions[ID] == false;
// //         return {
// //             gasEstimate,
// //             tested: true,
// //             gasPrice,
// //             maxFee: gas.maxFee,
// //             maxPriorityFee: gas.maxPriorityFee,
// //         };
// //     } catch (error: any) {
// //         // const data = await tradeLogs(trade);
// //         logger.error(
// //             `>>>>>>>>>>Error in fetchGasPrice for trade: ${ticker} ${type} ${error.reason} <<<<<<<<<<<<<<<<`,
// //         );
// //         return {
// //             gasEstimate,
// //             tested: false,
// //             gasPrice: gas.gasPrice,
// //             maxFee: maxFeeGasData,
// //             maxPriorityFee: maxPriorityFeeGasData,
// //         };
// //     }
// // }
// // // Calculation for single trade is easier since it doesn't require a custom contract.
// // if (type === "single") {
// //     let p = await params;

// //     try {
// //         gasEstimate = await swapSingle.swapSingle.estimateGas(
// //             // p.target,
// //             p.routerAID,
// //             p.routerBID,
// //             1, //p.tradeSize,
// //             0, //p.amountOutA,
// //             0, //p.amountOutB,
// //             p.path0,
// //             p.path1,
// //             p.to,
// //             p.deadline,
// //         );
// //         // logger.info(">>>>>>>>>>swapSingle gasEstimate SUCCESS: ", gasEstimate);
// //         let gasPrice = gasEstimate * gas.maxFee;
// //         // logger.info("swapSingle GASLOGS: ", gasPrice);
// //         logger.info(
// //             "swapSingle GASESTIMATE SUCCESS::::::",
// //             fu(gasPrice, 18),
// //         );
// //         pendingTransactions[ID] == false;
// //         return {
// //             gasEstimate: gasEstimate * 2n,
// //             tested: true,
// //             gasPrice,
// //             maxFee: gas.maxFee * 2n,
// //             maxPriorityFee: gas.maxPriorityFee,
// //         };
// //     } catch (error: any) {
// //         if (error.message.includes("Nonce too high")) {
// //             logger.error("Nonce too high. Skipping ");
// //             return g;
// //         } else {
// //             const data = await tradeLogs(trade);
// //             logger.error(
// //                 `>>>>>>>>>>>>>START: Error in fetchGasPrice for trade: ${
// //                     ticker
// //                 } ${loanPool.exchange + target.exchange} ${
// //                     type
// //                 } ${error.reason} <<<<<<<<<<<<<<<`,
// //                 error,
// //                 data.data,
// //                 `>>>>>>>>>>>>>>>>>>>>>>>>>>END: Error in fetchGasPrice for trade: ${ticker} ${type} ${error.reason} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`,
// //             );
// //             return g;
// //         }
// //     }
// // } else {
// //     return {
// //         gasEstimate,
// //         tested: false,
// //         gasPrice: BigInt(150n + 60n * gasEstimate),
// //         maxFee: maxFeeGasData,
// //         maxPriorityFee: maxPriorityFeeGasData,
// //     };
// // }
