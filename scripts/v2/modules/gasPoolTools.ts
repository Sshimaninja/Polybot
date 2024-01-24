import { ethers, Contract } from 'ethers'
import { wallet } from '../../../constants/environment'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { logger } from '../../../constants/environment'
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

export async function getgasPoolForTrade(
    trade: BoolTrade
): Promise<{ gasPool: Contract; gasTokenSymbol: string } | undefined> {
    const gasTokenAddresses = Object.values(gasTokens)

    for (const token in gasTokenAddresses) {
        try {
            // console.log(gasTokenAddresses[address])
            const address = gasTokenAddresses[token]
            const gasTokenSymbol = await getGasTokenKeyByAddress(address)
            console.log('Trying token ' + gasTokenSymbol + '...')

            if (gasTokenSymbol) {
                let gasPoolonLoanPool = await trade.loanPool.factory.getPair(
                    trade.tokenOut.id,
                    address
                )
                let gasPoolonTarget = await trade.target.factory.getPair(
                    trade.tokenOut.id,
                    address
                )

                let gasPoolID =
                    gasPoolonLoanPool ==
                    '0x0000000000000000000000000000000000000000'
                        ? gasPoolonTarget
                        : gasPoolonLoanPool

                if (gasPoolID == '0x0000000000000000000000000000000000000000') {
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
                    const gasPool = new ethers.Contract(
                        gasPoolID,
                        IPair,
                        wallet
                    )
                    return {
                        gasPool,
                        gasTokenSymbol,
                    }
                }

                if (
                    gasPoolID !== '0x0000000000000000000000000000000000000000'
                ) {
                    console.log(
                        'GasPool found for: ',
                        trade.tokenOut.symbol,
                        ' ',
                        gasTokenSymbol
                    )
                    const gasPool = new ethers.Contract(
                        gasPoolID,
                        IPair,
                        wallet
                    )
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
            console.log(`Error in getgasPoolForTrade: ${error}`)
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
