import { ethers, Contract } from 'ethers'
import { provider } from '../../../constants/environment'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { logger } from '../../../constants/logger'
import {
    GasToken,
    gasTokens,
    uniswapV2Factory,
} from '../../../constants/addresses'
import { BoolTrade } from '../../../constants/interfaces'
require('dotenv').config()
/**
 * Gets the gastoken/tradetoken address for a given trade, if WMATIC is not in the traded pool.
 * @param trade
 * @returns gasPool contract and symbol.
 */

export async function getGasPoolForTrade(
    trade: BoolTrade
): Promise<{ gasPool: Contract; gasTokenSymbol: string } | undefined> {
    const gasTokenAddresses = Object.values(gasTokens)
    for (const token in gasTokenAddresses) {
        try {
            // console.log(gasTokenAddresses[address])
            const address = gasTokenAddresses[token]
            const gasTokenSymbol = await getGasTokenKeyByAddress(address)
            console.log('Trying token ' + gasTokenSymbol + '...')
            const zeroAddress = '0x0000000000000000000000000000000000000000'
            let gasPool: Contract

            if (gasTokenSymbol) {
                console.log('finding gasPool on loanPool...')
                let gasPoolonLoanPool = await trade.loanPool.factory.getPair(
                    trade.tokenOut.id,
                    address
                )
                console.log('gasPoolonLoanPool: ', gasPoolonLoanPool)
                console.log('finding gasPool on target...')
                let gasPoolonTarget = await trade.target.factory.getPair(
                    trade.tokenOut.id,
                    address
                )
                console.log('gasPoolonTarget: ', gasPoolonTarget)
                let gasPoolID =
                    gasPoolonLoanPool == zeroAddress
                        ? gasPoolonTarget
                        : gasPoolonLoanPool

                if (gasPoolID == zeroAddress) {
                    console.log(
                        'GasPool not found for: ',
                        trade.tokenOut.symbol,
                        ' ',
                        gasTokenSymbol
                    )
                } else {
                    console.log(
                        'GasPool found for: ',
                        trade.tokenOut.symbol,
                        gasTokenSymbol
                    )
                    gasPool = new ethers.Contract(gasPoolID, IPair, provider)
                    return {
                        gasPool,
                        gasTokenSymbol,
                    }
                }

                if (gasPoolID !== zeroAddress) {
                    console.log(
                        'GasPool found for: ',
                        trade.tokenOut.symbol,
                        ' ',
                        gasTokenSymbol
                    )
                    gasPool = new ethers.Contract(gasPoolID, IPair, provider)
                    return {
                        gasPool,
                        gasTokenSymbol,
                    }
                } else {
                    logger.info(
                        'No gasPool Found for ',
                        trade.tokenOut.symbol,
                        ' ',
                        gasTokenSymbol,
                        '. Attempting another intermediary gasToken: ',
                        gasTokenSymbol,
                        '...'
                    )
                }
            }
        } catch (error) {
            console.trace(`Error in getGasPoolForTrade: ${error}`)
        }
    }

    return undefined
}

export async function getGasTokenKeyByAddress(
    address: string
): Promise<string | undefined> {
    const gasTokenKeys = Object.keys(gasTokens)
    for (let i = 0; i < gasTokenKeys.length; i++) {
        if (gasTokens[gasTokenKeys[i]] === address) {
            console.log('GasToken Key: ', gasTokenKeys[i])
            return gasTokenKeys[i]
        }
    }
    return undefined
}
