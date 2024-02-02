import { ethers } from 'ethers'
import { provider } from '../../..//constants/provider'
import { flashMulti } from '../../../constants/environment'
import { abi as IflashMulti } from '../../../artifacts/contracts/v2/flashMulti.sol/flashMulti.json'
import { config as dotenvConfig } from 'dotenv'
export const dotenv = dotenvConfig({
    path: `.env.live`,
})
export async function checkFunction(c: ethers.Contract, f: string) {
    if (c && typeof c.f === 'function') {
        const check = c.f
        console.log(check)
    } else {
        console.error('Function is not available on the contract object')
    }
}
checkFunction(flashMulti, 'flashSwap')
