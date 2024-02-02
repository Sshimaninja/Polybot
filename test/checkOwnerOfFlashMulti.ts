import { abi as IFlash } from '../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json'
import { flashMulti } from '../constants/environment'
import { provider } from '../constants/provider'
import { ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` })
if (process.env.FLASH_MULTI === undefined) {
    console.log('FLASH_MULTI is undefined')
    process.exit(1)
}

export async function checkOwner() {
    const owner = await flashMulti.checkOwner()
    console.log(owner)
}
checkOwner()
