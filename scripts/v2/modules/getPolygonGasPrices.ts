import axios from 'axios'
import { provider } from '../../../constants/provider'
import { GasData } from '../../../constants/interfaces'
/**
 *
 * @returns suggested gasData from polygon gas station
 *
 */
export async function getGasData(): Promise<GasData> {
    var gasData: GasData = {
        safeLow: {
            maxPriorityFee: 41,
            maxFee: 150,
        },
        standard: {
            maxPriorityFee: 52,
            maxFee: 158,
        },
        fast: {
            maxPriorityFee: 120,
            maxFee: 250,
        },
        estimatedBaseFee: 120,
        blockTime: 3,
        blockNumber: provider.getBlockNumber(),
    }
    try {
        const response = await axios.get(
            'https://gasstation.polygon.technology/v2'
        )
        if (response.data) {
            return response.data
        } else {
            console.log('Error in getGasData:  Using default gasData')
            return gasData
        }
    } catch (error) {
        console.log('Error in getGasData: Using default gasData')
        return gasData
    }
}
