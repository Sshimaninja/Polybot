import { ethers } from 'ethers'
import { config as dotenvConfig } from 'dotenv'
import { abi as IflashMulti } from '../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json'
import { abi as IflashDirect } from '../artifacts/contracts/v2/flashDirectTest.sol/flashDirectTest.json'
import { provider, wallet, signer } from './provider'
import { logger } from './logger'
export const dotenv = dotenvConfig({
    path: `.env.${process.env.NODE_ENV == 'test' ? 'test' : 'live'}`,
})

if (
    process.env.FLASH_MULTI === undefined ||
    process.env.FLASH_DIRECT === undefined
) {
    logger.error('No contract address set in .env file')
    throw new Error('No contract address set in .env file')
}

export const flashMultiID = process.env.FLASH_MULTI
export const flashDirectID = process.env.FLASH_DIRECT

export const flashMulti = new ethers.Contract(
    flashMultiID,
    IflashMulti,
    provider
)
export const flashDirect = new ethers.Contract(
    flashDirectID,
    IflashDirect,
    provider
)
