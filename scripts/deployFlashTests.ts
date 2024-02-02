import { ContractFactory, Typed, ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
import { provider, wallet, signer } from '..//constants/provider'
import {
    abi as flashMultiTestAbi,
    bytecode as flashMultiTestBytecode,
} from '../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json'

if (process.env.NODE_ENV === 'test') {
    dotEnvConfig({ path: '.env.test' })
} else {
    dotEnvConfig({ path: '.env.live' })
}
async function main() {
    try {
        const deployer = signer
        const owner = await deployer.getAddress()

        console.log('Deploying contracts with the account: ', owner)

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(owner)

        console.log('Account balance:', balanceDeployer.toString())

        const FlashMultiTestFactory = new ethers.ContractFactory(
            flashMultiTestAbi,
            flashMultiTestBytecode,
            deployer
        )
        console.log('Deploying flashMultiTest to ...')
        const flashmultitest = await FlashMultiTestFactory.deploy(owner)
        console.log('awaiting flashMultiTest.deployed()...')
        await flashmultitest.waitForDeployment()
        const flashMultiTestAddress = await flashmultitest.getAddress()
        console.log(
            "Contract 'flashMultiTest' deployed: " + flashMultiTestAddress
        )
        console.log(
            "Contract 'flashMultiTest' deployed:",
            flashMultiTestAddress
        )

        if (flashMultiTestAddress !== process.env.FLASH_MULTI) {
            console.log(
                'Contract address does not match .env file. Please update .env file with new contract address.'
            )
        }
        const checkOwnerMulti = flashmultitest.getFunction('checkOwner')

        const checkOwner = await checkOwnerMulti()
        console.log(checkOwner)
    } catch (error: any) {
        console.log('Error in deployFlashTests.ts:', error.message)
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
