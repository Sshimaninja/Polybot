import { ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
import { abi as IflashMulti } from '../artifacts/contracts/v2/flashMulti.sol/flashMulti.json'
import { abi as IflashDirect } from '../artifacts/contracts/v2/flashDirect.sol/flashDirect.json'

export class Environment {
    constructor() {
        if (process.env.NODE_ENV === 'test') {
            dotEnvConfig({ path: '.env.test' })
        } else {
            dotEnvConfig({ path: '.env.live' })
        }
    }

    provider = new ethers.JsonRpcProvider(process.env.RPC)

    getWallet(): {
        wallet: ethers.Wallet
        signer: ethers.Signer
    } {
        try {
            if (process.env.PRIVATE_KEY === undefined) {
                throw new Error('No private key set in .env file')
            }

            const wallet = new ethers.Wallet(
                process.env.PRIVATE_KEY,
                this.provider
            )
            const signer: ethers.Signer = wallet.connect(this.provider)
        } catch (error: any) {
            console.trace(error)
        }
        return { wallet, signer }
    }

    getContracts(): {
        flashMulti: ethers.Contract
        flashDirect: ethers.Contract
    } {
        try {
            if (
                process.env.FLASH_MULTI &&
                process.env.FLASH_DIRECT === undefined
            ) {
                throw new Error('No flashMultiID set in .env file')
            }

            const flashMultiID = process.env.FLASH_MULTI
            const flashDirectID = process.env.FLASH_DIRECT

            if (flashMultiID === undefined || flashDirectID === undefined) {
                throw new Error('No contract address set in .env file')
            }

            const flashMulti = new ethers.Contract(
                flashMultiID,
                IflashMulti,
                this.provider
            )
            const flashDirect = new ethers.Contract(
                flashDirectID,
                IflashDirect,
                this.provider
            )
        } catch (error: any) {
            console.trace(error)
        }
        return { flashMulti, flashDirect }
    }
}

export const env = new Environment()
export const wallet = env.getWallet().wallet
export const signer = env.getWallet().signer
export const provider = env.provider
export const flashMulti = env.getContracts().flashMulti
export const flashDirect = env.getContracts().flashDirect
