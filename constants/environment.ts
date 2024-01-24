import { ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
import { abi as IflashMulti } from '../artifacts/contracts/v2/flashMulti.sol/flashMulti.json'
import { abi as IflashDirect } from '../artifacts/contracts/v2/flashDirect.sol/flashDirect.json'
import { IERC20Interface } from '../typechain-types/flashMulti.sol/IERC20'

export class Environment {
    
    constructor() {
        if (process.env.NODE_ENV === 'test') {
            dotEnvConfig({ path: '.env.test' })
        } else {
            dotEnvConfig({ path: '.env.live' })
        }
    }

    provider = new ethers.JsonRpcProvider(process.env.RPC)

    async getWallet(): Promise<{
        wallet: ethers.Wallet
        signer: ethers.Signer
    }> {
        if (process.env.PRIVATE_KEY === undefined) {
            throw new Error('No private key set in .env file')
        }

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
        const signer: ethers.Signer = wallet.connect(this.provider)

        return Promise.resolve({ wallet, signer })
    }

    async getContracts(): Promise<{
        flashMulti: ethers.Contract
        flashDirect: ethers.Contract
    }> {
        if (process.env.FLASH_MULTI && process.env.FLASH_DIRECT === undefined) {
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
        return Promise.resolve({ flashMulti, flashDirect })
    }
}

export const env = new Environment()
