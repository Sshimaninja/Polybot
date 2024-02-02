require('dotenv').config()
require('colors')
import fs from 'fs'
import { BigNumber as BN } from 'bignumber.js'
import { Prices } from './modules/prices'
import { FactoryPair, TradePair } from '../../constants/interfaces'
import { AmountConverter } from './modules/amountConverter'
import { Trade } from './getTrade'
import { gasVprofit } from './modules/gasVprofit'
import { Reserves } from './modules/reserves'
import { tradeLogs } from './modules/tradeLog'
import { rollDamage } from './modules/damage'

let filteredTrades: string[]

try {
    const data = JSON.parse(fs.readFileSync('./filtered.json', 'utf-8'))
    filteredTrades = Array.isArray(JSON.parse(data)) ? JSON.parse(data) : []
} catch (error: any) {
    console.log('Error reading filtered.json: ' + error.message)
    filteredTrades = []
    fs.writeFileSync('./filtered.json', JSON.stringify(filteredTrades))
}

/*
TODO:
*/
/**
 * @param data
 * @param gasData
 * @description
 * This function controls the execution of the flash swaps.
 * It loops through all pairs, and all matches, and executes the flash swaps.
 * It prevents multiple flash swaps from being executed at the same time, on the same pool, if the profit is too low, or the gas cost too high.
 */

export const slippageTolerance = BN(0.006)

export async function control(data: FactoryPair[], gasData: any) {
    const promises: any[] = []

    for (const pair of data) {
        for (const match of pair.matches) {
            if (
                filteredTrades.includes(match.poolAID + match.poolBID) ||
                filteredTrades.includes(match.poolBID + match.poolAID)
            ) {
                // console.log(
                //     'Trade filtered:',
                //     match.ticker,
                //     'on ',
                //     pair.exchangeA + pair.exchangeB,
                //     'filtered out. Skipping...'
                // )
                return
            }

            const r = new Reserves(match)
            const reserves = await r.getReserves(match)

            //TODO: Arrange tokenIn/tokenOut so that the pool with higher reserves is loanPool and pool with lower reserves is target.
            //This will allow for more profitable trades, as the loanPool will have more liquidity to move the target price without requiring excess repayment.
            //Reversing the trade requires changing the token0/token1 assignment to token1/token0 in the Reserves class.
            if (reserves[0] !== undefined || reserves[1] !== undefined) {
                // console.log("ExchangeA: " + pair.exchangeA + " ExchangeB: " + pair.exchangeB + " matches: " + pair.matches.length, " gasData: " + gasData.fast.maxFee + " " + gasData.fast.maxPriorityFee);
                const p0 = new Prices(match.poolAID, reserves[0])
                const p1 = new Prices(match.poolBID, reserves[1])

                const t = new Trade(
                    pair,
                    match,
                    p0,
                    p1,
                    slippageTolerance,
                    gasData
                )
                const trade = await t.getTrade()

                if (trade.type === 'filtered') {
                    filteredTrades.push(trade.ID)
                    fs.writeFileSync(
                        './filtered.json',
                        JSON.stringify(trade.ID)
                    )
                }

                const dataPromise = tradeLogs(trade)
                const rollPromise = rollDamage(trade)

                promises.push(dataPromise, rollPromise)
            } else {
                console.log(
                    'Reserves not found for ' +
                        match.poolAID +
                        ' and ' +
                        match.poolBID
                ) +
                    ' reserves: ' +
                    reserves
            }
        }
    }

    await Promise.all(promises).catch((error: any) => {
        console.log('Error in swap.ts: ' + error.message)
    })
}
