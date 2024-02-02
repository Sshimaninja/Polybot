import { ethers } from 'hardhat'
import { config as dotenvConfig } from 'dotenv'
import { provider, wallet, signer } from '..//constants/provider'
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` })
import {
    abi as ITiny,
    bytecode,
} from '../artifacts/contracts/v2/tiny.sol/Tiny.json'

const TinyFactory = new ethers.ContractFactory(ITiny, bytecode, wallet)
async function main() {
    const tiny = await TinyFactory.deploy()
    console.log('Contract deployed to:', await tiny.getAddress())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
