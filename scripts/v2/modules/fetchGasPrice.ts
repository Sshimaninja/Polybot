import { BoolTrade, GAS, GasData } from '../../../constants/interfaces'
import { tradeLogs } from './tradeLog'
import { logger } from '../../../constants/logger'
import { fu, pu } from '../../modules/convertBN'
import { ethers } from 'ethers'
import { walledAddress } from '../../../constants/environment'

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
    // console.log('maxPriorityFeeString: ', maxPriorityFeeString)

    // console.log('maxPriorityFee: ', maxPriorityFee)

    // // Calculate the function selector
    // const swapFunctionSignature = 'swap(uint256,uint256,address,bytes)';
    // const swapFunctionSelector = ethers.id(swapFunctionSignature).substring(0, 10);

    // // Get the contract ABI
    // const loanContractABI = trade.loanPool.pool.getFunction('swap')
    // const targetContactABI = trade.target.pool.getFunction('swap')

    // const loanContractAddress = await trade.loanPool.pool.getAddress()
    // const targetContractAddress = await trade.target.pool.getAddress()

    // console.log('loanContractABI: ', loanContractABI)
    // console.log('loanContractID: ', loanContractAddress)
    // console.log('targetContractABI: ', targetContactABI)
    // console.log('targetContractID: ', targetContractAddress)
    // Check if the swap function exists in the contract ABI
    // const swapFunctionExists = pairContractABI.some(
    // 	(func) => ethers.id(func.name + '(' + func.inputs.map(i => i.type).join(',') + ')').substring(0, 10) === swapFunctionSelector
    // );

    // console.log('Swap function exists:', swapFunctionExists);

    // Print out the function signatures of the flash contracts

    if (trade.direction != undefined) {
        console.log('EstimatingGas for trade: ' + trade.ticker + '...')
        let gasEstimate: bigint
        try {
            //'override' error possibly too many args sent to contract? Or somethind to do with estimateGas not being able to properly create BigInts object.
            gasEstimate = await trade.flash.flashSwap.estimateGas(
                await trade.loanPool.factory.getAddress(),
                await trade.loanPool.router.getAddress(),
                await trade.target.router.getAddress(),
                trade.tokenIn.id,
                trade.tokenOut.id,
                trade.target.tradeSize,
                trade.target.amountOut,
                trade.loanPool.amountRepay,
                { from: walledAddress }
            )
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
            gasEstimate = pu('300000', 18)
            logger.info(error.reason)
            return {
                gasEstimate,
                tested: false,
                gasPrice: BigInt(150 + 60 * 300000),
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
            gasEstimate: BigInt(300000),
            tested: false,
            gasPrice: BigInt(150 + 60 * 300000),
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
