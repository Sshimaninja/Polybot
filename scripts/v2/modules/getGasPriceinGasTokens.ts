// import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
// import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
// import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
// import { abi as IERC20 } from "@uniswap/v2-core/build/IERC20.json";
// import { getAmountsOut } from "./getAmountsIOJS";
// import { BoolTrade, GasPool } from "../../../constants/interfaces";
// import { fu, pu } from "../../modules/convertBN";
// import { provider } from "../../../constants/provider";
// import { ethers } from "ethers";
// import {
//     gasTokens,
//     GasToken,
//     uniswapV2Factory,
//     uniswapV2Router,
//     FactoryMap,
// } from "../../../constants/addresses";
// import { wmatic, zero } from "../../../constants/environment";
// import { string } from "hardhat/internal/core/params/argumentTypes";
// import { factories } from "../../../typechain-types";
// let gasPools: GasPool[] = [];

// export async function gasPriceinGasTokens(trade: BoolTrade): Promise<GasPool[]> {
//     let gasPool: GasPool;
//     const wmaticID = await wmatic.getAddress();
//     let gasTokenRoute;
//     for (let key in uniswapV2Factory) {
//         const factoryID = uniswapV2Factory[key];
//         const bigFactory = new ethers.Contract(uniswapV2Factory[key], IUniswapV2Factory, provider);
//         for (let key in gasTokens) {
//             const gasTokenID = gasTokens[key];
//             if (gasTokenID !== wmaticID) {
//                 gasTokenRoute = await bigFactory.getPair(trade.tokenOut.id, gasTokenID);
//                 if (gasTokenRoute !== zero) {
//                     const gasPair = new ethers.Contract(gasTokenRoute, IPair, provider);
//                     const gasWmaticLiquidity = await gasPair.totalSupply();
//                     gasPool = {
//                         ticker: trade.tokenOut + key,
//                         address: gasTokenRoute,
//                         liquidity: gasWmaticLiquidity,
//                     };
//                     // console.log("getTokenPricesInWmatic: ", gasPool);
//                     gasPools.push(gasPool);
//                 }
//             }
//         }
//     }
//     // gasPools = await filterPools(gasPools);
//     // console.log(gasPools);
//     return gasPools;
// }

// // gasTokenPricesInWmatic();
// // // WRITE FUNCTION TO FIND GASPOOL ENTRIES OF THE SAME KEY AND FILTER BY LIQUIDITY
// async function filterPools(gasPools: GasPool[]) {
//     let filteredPools: GasPool[] = [];

//     for (let newPool of gasPools) {
//         let extantPool = filteredPools.find((p) => p.ticker === newPool.ticker);

//         if (!extantPool) {
//             // If there's no pool with the same ticker in the array, add the current pool
//             filteredPools.push(newPool);
//         } else if (BigInt(newPool.liquidity) > BigInt(extantPool.liquidity)) {
//             // If there's a pool with the same ticker and lower liquidity, replace it with the current pool
//             filteredPools = filteredPools.filter((p) => p.ticker !== newPool.ticker);
//             filteredPools.push(newPool);
//         }
//     }

//     console.log("filteredPoolsFunction: ", filteredPools);
//     return filteredPools;
// }
