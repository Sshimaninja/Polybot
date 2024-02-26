import { ethers, Contract } from "ethers";
import { BoolTrade /*WmaticProfit*/ } from "../constants/interfaces";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { getAmountsOut } from "../scripts/v2/modules/getAmounts/getAmountsIOJS";
import { BigNumber as BN } from "bignumber.js";
import { getAmountsOut as getAmountsOutBN } from "../scripts/v2/modules/getAmounts/getAmountsIOBN";
import { uniswapV2Exchange, gasTokens } from "../constants/addresses";
import { wallet, provider } from "../constants/provider";
import { logger } from "../constants/logger";
// import { getGasPoolForTrade } from "./getGasPool";
// import { getWmaticRate } from "./getWmaticRate";
// import { zero } from "../../../constants/environment";
import { fu, pu } from "../scripts/modules/convertBN";
import { zero, wmatic } from "../constants/environment";
import fs from "fs";

interface GasPool {
    ticker: string;
    tokenIn: { id: string; decimals: number; symbol: string };
    tokenOut: { id: string; decimals: number; symbol: string };
    id: string;
    exchange: string;
    reserves: {
        reserve0: bigint;
        reserve1: bigint;
    };
    liquidity: bigint;
}
export async function getGas2WMATICArray(): Promise<GasPool[]> {
    async function getGasTokentoWMATICPool(): Promise<GasPool[]> {
        const wmaticID = await wmatic.getAddress();
        const gasPools: GasPool[] = [];
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

                        const gasPool: GasPool = {
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
                        gasPools.push(gasPool);
                    }
                }
            }
            // console.log("gasPools: ", gasPools);
            return gasPools;
        }
        console.log("Something wrong with the gasPools: ", gasPools);
        return gasPools;
    }

    async function compareLiquidity(gasPools: GasPool[]): Promise<GasPool[]> {
        const highestLiquidityPools: { [key: string]: GasPool } = {};

        for (let gasPool of gasPools) {
            // Create a unique key for the pair of tokens
            const key = gasPool.tokenIn.id;

            // If the key doesn't exist in the object, or if the current gasPool has higher liquidity,
            // add/replace the gasPool in the object
            if (
                !highestLiquidityPools[key] ||
                gasPool.liquidity > highestLiquidityPools[key].liquidity
            ) {
                highestLiquidityPools[key] = gasPool;
            }
        }

        // Convert the object values to an array and return it
        console.log("highestLiquidityPools: ", highestLiquidityPools);
        return Object.values(highestLiquidityPools);
    }
    const gasPools = await getGasTokentoWMATICPool();
    const highestLiquidityPools = await compareLiquidity(gasPools);
    fs.writeFile(
        "./constants/gasPools.json",
        JSON.stringify(highestLiquidityPools, (key, value) => {
            if (typeof value === "bigint") {
                return value.toString();
            }
            return value;
        }),
        (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("File has been created");
        },
    );
    return highestLiquidityPools;
}
getGas2WMATICArray();

/*

*/
