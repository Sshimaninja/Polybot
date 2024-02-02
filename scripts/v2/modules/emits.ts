import { ethers as utils } from 'ethers'
import { provider } from '../../../constants/provider'
import { BoolTrade } from '../../../constants/interfaces'
export async function logEmits(trade: BoolTrade, req: any) {
    try {
        const filter = {
            address: trade.flash.getAddress(),
            topics: [
                utils.id('log(string,uint256)'),
                utils.id('logValue(string,uint256)'),
                utils.id('logAddress(string,address)'),
            ],
        }

        provider.on(filter, (log) => {
            // log is a Log object that matches the filter
            console.log(log)
        })

        provider.once(req.txResponse.hash, (transaction) => {
            console.log(req.txResponse.hash)
            console.log(transaction)
        })
    } catch (error: any) {
        console.error('Error logging transaction emits: ' + error.message)
    }
}
