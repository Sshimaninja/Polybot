import { ethers } from 'hardhat'
import { config as dotEnvConfig } from 'dotenv'
import { wallet } from '../constants/provider'
dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` })
import {
    abi as IcheckOwner,
    bytecode,
} from '../artifacts/contracts/v2/checkOwner.sol/isItMine.json'

const checkOwnerFactory = new ethers.ContractFactory(
    IcheckOwner,
    bytecode,
    wallet
)

async function main() {
    const check = await checkOwnerFactory.deploy(wallet)
    console.log('Contract deployed to:', await check.getAddress())
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
// Path: scripts/deployCheckOwner.ts
