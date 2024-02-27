import { ethers, Contract } from "ethers";
import { BoolTrade /*WmaticProfit*/, ToWMATICPool } from "../constants/interfaces";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { getAmountsOut } from "../scripts/v2/modules/price/getAmountsIOJS";
import { BigNumber as BN } from "bignumber.js";
import { getAmountsOut as getAmountsOutBN } from "../scripts/v2/modules/price/getAmountsIOBN";
import { uniswapV2Exchange, gasTokens } from "../constants/addresses";
import { wallet, provider } from "../constants/provider";
import { logger } from "../constants/logger";
// import { getToWMATICPoolForTrade } from "./getToWMATICPool";
// import { getWmaticRate } from "./getWmaticRate";
// import { zero } from "../../../constants/environment";
import { fu, pu } from "../scripts/modules/convertBN";
import { zero, wmatic } from "../constants/environment";
import fs from "fs";

// interface ToWMATICPool {
//     ticker: string;
//     tokenIn: { id: string; decimals: number; symbol: string };
//     tokenOut: { id: string; decimals: number; symbol: string };
//     id: string;
//     exchange: string;
//     reserves: {
//         reserve0: bigint;
//         reserve1: bigint;
//     };
//     liquidity: bigint;
// }
export async function getGas2WMATICArray(): Promise<ToWMATICPool[]> {
    async function getGasTokenToWMATICPool(): Promise<ToWMATICPool[]> {
        const wmaticID = await wmatic.getAddress();
        const ToWMATICPools: ToWMATICPool[] = [];
        for (let exchange in uniswapV2Exchange) {
            let exchangeID = uniswapV2Exchange[exchange].factory;
            for (let token in gasTokens) {
                if (gasTokens[token] !== wmaticID) {
                    let tokenID = gasTokens[token];
                    const factory = new Contract(exchangeID, IUniswapV2Factory, wallet);
                    const pair = await factory.getPair(wmaticID, tokenID);
                    if (pair != zero) {
                        const pairContract = new Contract(pair, IPair, wallet);
                        const r = await pairContract.getReserves();
                        const r0: bigint = r[0];
                        const r1: bigint = r[1];
                        const token0 = {
                            id: await pairContract.token0(),
                            decimals: await pairContract.decimals(),
                            reserves: r0,
                        };
                        const token1 = {
                            id: await pairContract.token1(),
                            decimals: await pairContract.decimals(),
                            reserves: r1,
                        };
                        const tokenIn = token0.id == wmaticID ? token1 : token0;
                        const tokenOut = token0.id == wmaticID ? token0 : token1;

                        const ToWMATICPool: ToWMATICPool = {
                            ticker: token + "WMATIC",
                            id: pair,

                            exchange: exchange,
                            tokenIn: { id: tokenIn.id, decimals: tokenIn.decimals, symbol: token },
                            tokenOut: {
                                id: tokenOut.id,
                                decimals: tokenOut.decimals,
                                symbol: "WMATIC",
                            },
                            reserves: {
                                reserve0: tokenIn.reserves,
                                reserve1: tokenOut.reserves,
                            },
                            liquidity: tokenIn.reserves * tokenOut.reserves,
                        };
                        ToWMATICPools.push(ToWMATICPool);
                    }
                }
            }
            // console.log("ToWMATICPools: ", ToWMATICPools);
            return ToWMATICPools;
        }
        console.log("Something wrong with the ToWMATICPools: ", ToWMATICPools);
        return ToWMATICPools;
    }

    async function compareLiquidity(ToWMATICPools: ToWMATICPool[]): Promise<ToWMATICPool[]> {
        const highestLiquidityPools: { [key: string]: ToWMATICPool } = {};

        for (let ToWMATICPool of ToWMATICPools) {
            // Create a unique key for the pair of tokens
            const key = ToWMATICPool.tokenIn.id;

            // If the key doesn't exist in the object, or if the current ToWMATICPool has higher liquidity,
            // add/replace the ToWMATICPool in the object
            if (
                !highestLiquidityPools[key] ||
                ToWMATICPool.liquidity > highestLiquidityPools[key].liquidity
            ) {
                highestLiquidityPools[key] = ToWMATICPool;
            }
        }

        // Convert the object values to an array and return it
        // console.log("highestLiquidityPools: ", highestLiquidityPools);
        return Object.values(highestLiquidityPools);
    }
    const ToWMATICPools = await getGasTokenToWMATICPool();
    const highestLiquidityPools = await compareLiquidity(ToWMATICPools);
    // fs.writeFile(
    //     "./constants/ToWMATICPools.json",
    //     JSON.stringify(highestLiquidityPools, (key, value) => {
    //         if (typeof value === "bigint") {
    //             return value.toString();
    //         }
    //         return value;
    //     }),
    //     (err) => {
    //         if (err) {
    //             console.error(err);
    //             return;
    //         }
    //         console.log("File has been created");
    //     },
    // );
    return highestLiquidityPools;
}
getGas2WMATICArray();

/*

*/
