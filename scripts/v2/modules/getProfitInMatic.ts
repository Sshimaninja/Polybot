import { ethers, Contract } from 'ethers'
import { BoolTrade } from '../../../constants/interfaces'
import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { getAmountsOut } from './getAmountsIOLocal'
import { gasTokens } from '../../../constants/addresses'
import { wallet, provider } from '../../../constants/provider'
import { logger } from '../../../constants/logger'
import { getGasPoolForTrade } from './gasPoolTools'
require('dotenv').config()
/**
 * @description
 * This function returns the profit in Matic for a given trade.
 * @param trade
 * @returns MaticProfit{profitInMatic: bigint, gasPool: Contract}
 */
interface MaticProfit {
    profitInMatic: bigint
    gasPool: Contract
}

export async function getProfitInMatic(trade: BoolTrade): Promise<MaticProfit> {
    const matic = gasTokens.WMATIC

    if (trade.tokenOut.id == matic) {
        console.log('[getProfitInMatic]: tokenOut is WMATIC')
        let profitInMatic = trade.profit
        let gasPool = new Contract(
            await trade.target.pool.getAddress(),
            IPair,
            wallet
        )
        let maticProfit = { profitInMatic, gasPool }
        return maticProfit
    }

    if (trade.tokenIn.id == matic) {
        console.log('[getProfitInMatic]: tokenIn is WMATIC')
        let inMatic = await getAmountsOut(
            trade.profit,
            trade.target.reserveOut,
            trade.target.reserveIn
        )
        let profitInMatic = inMatic
        let gasPool = new Contract(
            await trade.target.pool.getAddress(),
            IPair,
            wallet
        )
        let maticProfit = { profitInMatic, gasPool }
        return maticProfit
    }

    let g = await getGasPoolForTrade(trade)

    if (g == undefined) {
        let maticProfit = {
            profitInMatic: 0n,
            gasPool: new Contract(
                await trade.target.pool.getAddress(),
                IPair,
                wallet
            ),
        }
        return maticProfit
    }

    if (g != undefined) {
        console.log('gasToken: ', g.gasTokenSymbol)

        const gasPool = g.gasPool

        logger.info(
            '<<<<<<<<<<<<<<<<<<<<<<<<<BEGIN GAS CONVERSION LOOP: ',
            trade.ticker,
            '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'
        )

        logger.info(
            'Pair: ',
            trade.ticker,
            ' finding profit through ',
            trade.tokenOut.symbol,
            '/',
            g.gasTokenSymbol != 'WMATIC' ? g.gasTokenSymbol : '',
            '/WMATIC'
        )

        logger.info('gasPool.getAddress(): ', await gasPool.getAddress())

        const token0 = await gasPool.token0()
        const token1 = await gasPool.token1()

        //Case: trade.tokenOut.id is paired with WMATIC
        if (token1 == matic) {
            logger.info(
                '[getProfitInMatic]: Case 1: trade.tokenOut.id is paired with WMATIC'
            )
            const reserves = await gasPool.getReserves()
            const profitInMatic = await getAmountsOut(
                trade.profit,
                reserves[0],
                reserves[1]
            )
            // const profitInMatic = pu(profitInMaticBN.toFixed(18), 18)
            let maticProfit = { profitInMatic, gasPool }
            return maticProfit
        }

        //Case: trade.tokenOut.id is paired with a WMATIC, but is in trade.tokenInID position
        if (token0 == matic) {
            logger.info(
                '[getProfitInMatic]: Case 2: trade.tokenOut.id is paired with a WMATIC, but is in trade.tokenInID position'
            )
            const reserves = await gasPool.getReserves()
            const profitInMatic = await getAmountsOut(
                trade.profit,
                reserves[1],
                reserves[0]
            )
            // const profitInMatic = pu(profitInMaticBN.toFixed(18), 18)
            let maticProfit = { profitInMatic, gasPool }
            return maticProfit
        }

        //Case: trade.tokenOut.id is paired with a gasToken in the trade.tokenIn position
        if (token0 && token1 != matic && token0 == trade.tokenOut.id) {
            logger.info(
                '[getProfitInMatic]: Case 3: trade.tokenOut.id is paired with a gasToken in the trade.tokenIn position'
            )
            const reserves = await gasPool.getReserves()
            const profitInGasToken = await getAmountsOut(
                trade.profit,
                reserves[0],
                reserves[1]
            ) //returns profit in gasToken/WMATIC
            const gasMaticPool = await (trade.loanPool.factory.getPair(
                token1,
                matic
            ) ??
                trade.target.factory.getPair(token1, matic) ??
                undefined)
            console.log(gasMaticPool.token1, matic)
            const gasSMaticPoolContract = new ethers.Contract(
                gasMaticPool,
                IPair,
                provider
            )
            const profitInMatic =
                (await gasSMaticPoolContract.token1()) == matic
                    ? await getAmountsOut(
                          trade.profit,
                          reserves[0],
                          reserves[1]
                      )
                    : await getAmountsOut(
                          profitInGasToken,
                          reserves[1],
                          reserves[0]
                      )
            // const profitInMatic = pu(profitInMaticBN.toFixed(18), 18)
            let maticProfit = { profitInMatic, gasPool }
            return maticProfit
        }

        //Case: trade.tokenOut.id is paired with a gasToken in the trade.tokenOut position
        if (token0 && token1 != matic && token1 == trade.tokenOut.id) {
            logger.info(
                '[getProfitInMatic]: Case 4: trade.tokenOut.id is paired with a gasToken in the trade.tokenOut position'
            )
            const reserves = await gasPool.getReserves()
            const profitInGasToken = await getAmountsOut(
                trade.profit,
                reserves[1],
                reserves[0]
            ) //returns profit in gasToken/MWATIC
            const gasMaticPool =
                (await trade.loanPool.factory.getPair(
                    gasPool.token0(),
                    matic
                )) ??
                trade.target.factory.getPair(gasPool.token0(), matic) ??
                undefined
            console.log(gasMaticPool.token0, matic)
            const gasSMaticPoolContract = new ethers.Contract(
                gasMaticPool,
                IPair,
                provider
            )
            const profitInMatic =
                (await gasSMaticPoolContract.token1()) == matic
                    ? await getAmountsOut(
                          trade.profit,
                          reserves[1],
                          reserves[0]
                      )
                    : await getAmountsOut(
                          profitInGasToken,
                          reserves[0],
                          reserves[1]
                      )
            // const profitInMatic = pu(profitInMaticBN.toFixed(18), 18)
            let maticProfit = { profitInMatic, gasPool }
            return maticProfit
        }
    }
    // If none of the conditions are met, return a default MaticProfit object
    return {
        profitInMatic: 0n,
        gasPool: new Contract(
            await trade.target.pool.getAddress(),
            IPair,
            wallet
        ),
    }
}
