import { Contract, ethers } from 'ethers'
import { provider, wallet } from '../../../constants/provider'
import {
    deployedMap,
    gasTokens,
    uniswapV2Factory,
} from '../../../constants/addresses'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as IERC20 } from '@uniswap/v2-periphery/build/IERC20.json'
import { fetchGasPrice } from './fetchGasPrice'
import { fu } from '../../modules/convertBN'
require('dotenv').config()
/**
 * checks gas token balance of the flashwallet
 * @param token0
 * @param token0dec
 * @param token1
 * @param token1dec
 */

export async function checkBal(
    token0: string,
    token0dec: number,
    token1: string,
    token1dec: number
) {
    const erctoken0 = new ethers.Contract(token0, IERC20, provider)
    const erctoken1 = new ethers.Contract(token1, IERC20, provider)
    const wmatictoken = new ethers.Contract(gasTokens.WMATIC, IERC20, provider)

    const walletbalance0 = await erctoken0.balanceOf(await wallet.getAddress())
    const walletbalance1 = await erctoken1.balanceOf(await wallet.getAddress())
    const walletbalanceMatic = await wmatictoken.balanceOf(
        await wallet.getAddress()
    )

    console.log('New wallet balance: ')
    console.log('Wallet: ' + wallet.getAddress())
    console.log(
        'Wallet balance token0: ' +
            fu(walletbalance0, token0dec) +
            ' Asset:  ' +
            token0
    )
    console.log(
        'Wallet balance token1: ' +
            fu(walletbalance1, token1dec) +
            ' Asset:  ' +
            token1
    )
    console.log(
        'Wallet Balance Matic: ' + fu(walletbalanceMatic, 18) + ' ' + 'MATIC'
    )
    // console.log("Block Number: " + (await provider.getBlockNumber()))
    // console.log("Contract balance: " + contractbalance.toString() + " " + deployedMap.flashTest)
}
// checkBal("0x2791bca1f2de4661ed88a30c99a7a9449aa84174", 6, "0x67eb41a14c0fe5cd701fc9d5a3d6597a72f641a6", 18);

export async function checkGasBal(): Promise<bigint> {
    const wmatictoken = new ethers.Contract(
        '0x0000000000000000000000000000000000001010',
        IERC20,
        provider
    )
    const walletbalanceMatic = await wmatictoken.balanceOf(
        await wallet.getAddress()
    )
    // console.log("Wallet Balance Matic: " + fu(walletbalanceMatic, 18) + " " + "MATIC")
    return walletbalanceMatic
}
