import { Contract } from 'ethers'
import { wallet } from '../../../constants/provider'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as IRouter } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
/**
 * Direct UniswapV2 protocol query calculation of amounts in/out
 * @param amountIn
 * @param reserveIn
 * @param reserveOut
 * @returns amountOut or amountIn
 */

export async function getAmountsOut(
    routerID: string,
    amountIn: bigint,
    path: string[]
) {
    const router = new Contract(routerID, IRouter, wallet)
    var amountReceived = await router.getAmountsOut(amountIn, path)
    return amountReceived
}

export async function getAmountsIn(
    routerID: string,
    amountOut: bigint,
    path: string[]
) {
    const router = new Contract(routerID, IRouter, wallet)
    var amountRequired = await router.getAmountsIn(amountOut, path)
    return amountRequired
}
