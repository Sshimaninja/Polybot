import { ContractFactory, Typed, ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
import { provider, signer } from '../../constants/provider'
import {
    abi as flashMultiTestAbi,
    bytecode as flashMultiTestBytecode,
} from '../../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json'

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` })
async function main() {
    try {
        console.log('Deploying contracts with the account: ', signer)

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(signer)

        console.log('Account balance:', balanceDeployer.toString())

        const FlashMultiTestFactory = new ethers.ContractFactory(
            flashMultiTestAbi,
            flashMultiTestBytecode,
            signer
        )
        console.log('Deploying flashMultiTest to ...')
        const flashmultitest = await FlashMultiTestFactory.deploy(signer)
        console.log('awaiting flashMultiTest.deployed()...')
        await flashmultitest.waitForDeployment()
        const flashMultiTestAddress = await flashmultitest.getAddress()
        console.log(
            "Contract 'flashMultiTest' deployed: " + flashMultiTestAddress
        )
        if (flashMultiTestAddress !== process.env.FLASH_MULTI) {
            console.log(
                'Contract address does not match .env file. Please update .env file with new contract address.'
            )
        }
        const flashMultiContract = new ethers.Contract(
            flashMultiTestAddress,
            flashMultiTestAbi,
            provider
        )
        const checkOwnerMulti = await flashMultiContract.checkOwner()

        console.log(checkOwnerMulti)
    } catch (error: any) {
        console.log('Error in deployFlashTests.ts:', error.message)
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
