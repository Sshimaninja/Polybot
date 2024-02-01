import { BoolTrade, GAS, GasData } from '../../../constants/interfaces'
import { tradeLogs } from './tradeLog'
import { logger } from '../../../constants/logger'
import { fu, pu } from '../../modules/convertBN'
import { ethers } from 'ethers'
import { provider, walletAddress } from '../../../constants/environment'
import { abi as IflashMulti } from '../../../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json'

/**
 * @param trade
 * @returns gas estimate and gas price for a given trade.
 * If the gasEstimate fails, it will return a default gas estimate of 300000.
 * @returns gasData: { gasEstimate: bigint, gasPrice: bigint, maxFee: number, maxPriorityFee: number }
 */
export async function fetchGasPrice(trade: BoolTrade): Promise<GAS> {
    // Commented out for now to elimiate from testing & debugging:

    const maxFeeGasData = trade.gasData.fast.maxFee //150 is placeholder until gasData works.
    // console.log('maxFeeGasData: ', maxFeeGasData)

    const maxPriorityFeeGasData = trade.gasData.fast.maxPriorityFee //60 is placeholder until gasData works.
    // console.log('maxPriorityFeeGasData: ', maxPriorityFeeGasData)

    const maxFee = BigInt(Math.trunc(maxFeeGasData * 10 ** 9))
    // console.log('maxFeeString: ', maxFeeString)

    const maxPriorityFee = BigInt(Math.trunc(maxPriorityFeeGasData * 10 ** 9))
    // console.log('maxPriorityFeeString: ', maxPriorityFeeString

    let gasEstimate = BigInt(30000000)

    if (trade.direction != undefined) {
        console.log('EstimatingGas for trade: ' + trade.ticker + '...')
        try {
            // logger.info('params: ', p)
            // const flashAddress = await trade.flash.getAddress()
            // logger.info('trade.flash Address: ', flashAddress)
            // logger.info('env.flash   address: ', process.env.FLASH_MULTI)
            // const flashFunction = trade.flash.flashSwap
            // logger.info('flashFunction: ', flashFunction)
            // console.log('trade.flash:', trade.flash)

            // const flashSwapFunction = await trade.flash.flashSwap.getFunction()
            gasEstimate = await trade.flash.flashSwap.estimateGas({
                loanFactory: await trade.loanPool.factory.getAddress(),
                loanRouter: await trade.loanPool.router.getAddress(),
                recipientRouter: await trade.target.router.getAddress(),
                token0ID: trade.tokenIn.id,
                token1ID: trade.tokenOut.id,
                amount0In: trade.target.tradeSize,
                amount1Out: trade.target.amountOut,
                amountToRepay: trade.loanPool.amountRepay,
            })
            console.log('>>>>>>>>>>gasEstimate: ', gasEstimate)
            // gasEstimate = await trade.flash.estimateGas('flashSwap', [
            //     {
            //         loanFactory: await trade.loanPool.factory.getAddress(),
            //         loanRouter: await trade.loanPool.router.getAddress(),
            //         recipientRouter: await trade.target.router.getAddress(),
            //         token0ID: trade.tokenIn.id,
            //         token1ID: trade.tokenOut.id,
            //         amount0In: trade.target.tradeSize,
            //         amount1Out: trade.target.amountOut,
            //         amountToRepay: trade.loanPool.amountRepay,
            //     },
            // ])
        } catch (error: any) {
            const data = await tradeLogs(trade)
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>TRADE DATA: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.error(data)
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>END TRADE DATA: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>ERROR DATA: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.error(error)
            logger.trace('TRACE:')
            logger.trace(error)
            console.trace('CONSOLE TRACE:')
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>END ERROR DATA: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.error(
                `>>>>>>>>>>>>>>>>>>>>>>>>>>Error in fetchGasPrice for trade: ${trade.ticker} <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`
            )
            logger.info(error.reason)
            return {
                gasEstimate,
                tested: false,
                gasPrice: BigInt(150n + 60n * gasEstimate),
                maxFee,
                maxPriorityFee,
            }
        }
        // Helpful for figuring out how to determine and display gas prices:
        const gasLogs = {
            gasEstimate: gasEstimate,
            gasPrice: fu(maxFee + maxPriorityFee * BigInt(10), 18),
            maxFee: fu(maxFee, 18),
            maxPriorityFee: fu(maxPriorityFee, 18),
            gasLimit: fu(gasEstimate, 18),
            gasEstimateTimesMaxFee: fu(gasEstimate * maxFee, 18),
            gasEstimateTimesMaxPriorityFee: fu(
                gasEstimate * maxPriorityFee,
                18
            ),
            gasEstimateTimesMaxFeePlusMaxPriorityFee: fu(
                gasEstimate * (maxFee + maxPriorityFee),
                18
            ),
            gasEstimateTimesMaxFeePlusMaxPriorityFeeTimes10: fu(
                (gasEstimate * (maxFee + maxPriorityFee) + maxFee) * BigInt(10),
                18
            ),
        }
        console.log(gasLogs)
        const gasPrice =
            (gasEstimate * (maxFee + maxPriorityFee) + maxFee) * BigInt(10)
        console.log(gasLogs)
        console.log(fu(gasPrice, 18))
        return {
            gasEstimate,
            tested: true,
            gasPrice,
            maxFee: maxFee,
            maxPriorityFee: maxPriorityFee,
        }
    } else {
        console.log(
            `>>>>>>>>>>>>>>>>>>>>> (fetchGasPrice) Trade direction undefined: ${trade.ticker} `,
            ` <<<<<<<<<<<<<<<<<<<<<<<<<< `
        )
        return {
            gasEstimate,
            tested: false,
            gasPrice: BigInt(150n + 60n * gasEstimate),
            maxFee: maxFee,
            maxPriorityFee: maxPriorityFee,
        }
    }
}

/*
	GAS EXAMPLE FROM ETHERS.JS ^6.0.0:
	lastBaseFeePerGas = block.baseFeePerGas;
	maxPriorityFeePerGas = BigInt("1500000000");
	maxFeePerGas = block.baseFeePerGas * (2) + (maxPriorityFeePerGas);
*/
