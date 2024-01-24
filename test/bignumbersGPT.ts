import { provider } from '../constants/environment'
import { FixedNumber, utils, Contract } from 'ethers'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { BigNumber as BN } from 'bignumber.js'

async function main() {
    const Pair0 = new Contract(
        '0x34965ba0ac2451a34a0471f04cca3f990b8dea27',
        IPair,
        provider
    )
    var aReserves = await Pair0.getReserves().catch((error: any) => {
        console.log('Error (getReserves(sushi)): ' + error)
        // return;
    })
    const exchangeA = 'SUSHI'
    const ticker = 'WETH/USDT'

    const token0dec = 6
    const token1dec = 18
    console.log('token0dec: ' + token0dec + '\ntoken0Dec: ' + token1dec)
    const PRECISION = token0dec < token1dec ? token0dec : token1dec
    //Exchange A pricing and reserves
    // Using bignumber.js to format reserves and price instead of ethers.js BigInt implementation:
    const aReserve0 = aReserves[0]
    const aReserve1 = aReserves[1]
    var aReserve0Formatted = Number(fu(aReserve0, token0dec).toString())
    var aReserve1Formatted = Number(fu(aReserve1, token1dec).toString())
    var aPrice0 = aReserve0Formatted / aReserve1Formatted
    var aPrice1 = aReserve1Formatted / aReserve0Formatted
    var aPrice0BN = new BN(aReserve0Formatted).div(aReserve1Formatted)
    var aPrice1BN = new BN(aReserve1Formatted).div(aReserve0Formatted)
    var aPrice0BNFormatted = aPrice0BN.toString()
    var aPrice1BNFormatted = aPrice1BN.toString()

    let aPriceMap = {
        exchange: exchangeA,
        asset: ticker,
        aPrice0: aPrice0,
        aPrice1: aPrice1,
        Reserves0: aReserve0,
        Reserves1: aReserve1,
        Reserves0Formatted: aReserve0Formatted,
        Reserves1Formatted: aReserve1Formatted,
        aPrice0BN: aPrice0BN,
        aPrice1BN: aPrice1BN,
        aPrice0BNFormatted: aPrice0BNFormatted,
        aPrice1BNFormatted: aPrice1BNFormatted,
    }
    console.log({
        exchangeA: aPriceMap,
    })
}
main()
