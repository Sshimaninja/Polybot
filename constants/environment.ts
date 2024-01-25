import { ethers } from 'ethers'
import { config as dotenvConfig } from 'dotenv'
import { abi as IflashMulti } from '../artifacts/contracts/v2/flashMulti.sol/flashMulti.json'
import { abi as IflashDirect } from '../artifacts/contracts/v2/flashDirect.sol/flashDirect.json'
import { provider as p, checkProvider } from './provider'
export const dotenv = dotenvConfig({
    path: `.env.${process.env.NODE_ENV == 'test' ? 'test' : 'live'}`,
})

export class Environment {
    constructor() {}

    getWallet(): {
        wallet: ethers.Wallet
        signer: ethers.Signer
    } {
        if (process.env.PRIVATE_KEY === undefined) {
            throw new Error('No private key set in .env file')
            console.log(process.env.PRIVATE_KEY)
        }
        let wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
        let signer = wallet.connect(provider)
        return { wallet, signer }
    }

    getContracts(): {
        flashMulti: ethers.Contract
        flashDirect: ethers.Contract
    } {
        if (process.env.FLASH_MULTI && process.env.FLASH_DIRECT === undefined) {
            throw new Error('No flashMultiID set in .env file')
        }

        const flashMultiID = process.env.FLASH_MULTI
        const flashDirectID = process.env.FLASH_DIRECT

        if (flashMultiID === undefined || flashDirectID === undefined) {
            throw new Error('No contract address set in .env file')
        }
        let flashMulti: ethers.Contract
        let flashDirect: ethers.Contract
        flashMulti = new ethers.Contract(flashMultiID, IflashMulti, provider)
        flashDirect = new ethers.Contract(flashDirectID, IflashDirect, provider)
        return { flashMulti, flashDirect }
    }
}

export const env = new Environment()
export const wallet = env.getWallet().wallet
export const signer = env.getWallet().signer
export const provider = p
export const flashMulti = env.getContracts().flashMulti
export const flashDirect = env.getContracts().flashDirect
