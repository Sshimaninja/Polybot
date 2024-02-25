import { Contract } from "ethers";
import { wallet } from "../../../../constants/provider";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IRouter } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
/**
 * Direct UniswapV2 protocol query calculation of amounts in/out
 * @param routerID
 * @param amountIn or amountOut
 * @param path[]
 * @returns amountOut or amountIn
 */

export async function getAmountsOut(router: Contract, amountIn: bigint, path: string[]) {
    var amountReceived = await router.getAmountsOut(amountIn, path);
    return amountReceived[1];
}

export async function getAmountsIn(router: Contract, amountOut: bigint, path: string[]) {
    var amountRequired = await router.getAmountsIn(amountOut, path);
    return amountRequired[0];
}
