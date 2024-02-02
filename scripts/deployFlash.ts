import { ethers as eh, run, network } from 'hardhat'
import { ContractFactory, Typed, ethers } from 'ethers'
import { config as dotEnvConfig } from 'dotenv'
import { provider, signer } from '..//constants/provider'

if (process.env.NODE_ENV === 'test') {
    dotEnvConfig({ path: '.env.test' })
} else {
    dotEnvConfig({ path: '.env.live' })
}

//TODO: CONVERT TO LIVE DEPLOYMENTS
// npx hardhat run --network localhost scripts/deployFlashTests.ts

async function main() {
    try {
        const deployer = signer
        const owner = await deployer.getAddress()

        console.log(
            'Deploying contracts with the account: ' + deployer.getAddress()
        )

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(deployer.getAddress())

        console.log('Account balance:', balanceDeployer.toString())

        const flashMultiTest = await eh.getContractFactory('flashMultiTest')
        const flashDirectTest = await eh.getContractFactory('flashDirectTest')
        console.log('Deploying flashMultiTest to ' + network.name + '...')
        const flashmultitest = await flashMultiTest.deploy(owner)
        console.log('Deploying flashDirectTest to ' + network.name + '...')
        const flashdirecttest = await flashDirectTest.deploy(owner)
        console.log('awaiting flashMultiTest.deployed()...')
        await flashmultitest.waitForDeployment() //.deployed();
        console.log('awaiting flashDirectTest.deployed()...')
        await flashdirecttest.waitForDeployment()
        console.log(
            "Contract 'flashMultiTest' deployed: " +
                (await flashmultitest.getAddress())
        )
        console.log(
            "Contract 'flashDirectTest' deployed: " +
                (await flashdirecttest.getAddress())
        )
        const flashMultiTestID = await flashmultitest.getAddress()
        const flashDirectTestID = await flashdirecttest.getAddress()
        if (
            flashDirectTestID !== process.env.FLASH_MULTI ||
            flashMultiTestID !== process.env.FLASH_DIRECT
        ) {
            console.log(
                'Contract address does not match .env file. Please update .env file with new contract address.'
            )
        }

        // if ((network.config.chainId === 137 && process.env.POLYGONSCAN_APIKEY) || (network.config.chainId === 80001 && process.env.MUMBAISCAN_API_KEY)) {
        // 	await flashmultitest.deployTransaction.wait(12);
        // 	// verify(flashmultitest.getAddress(), [owner]);

        // } else if (network.config.chainId === 31337) {
        // 	console.log("Verification failed: Network is Hardhat");
        // } else {
        const checkOwnerMultiFunction = flashmultitest.getFunction('checkOwner')
        const checkOwnerMulti = await checkOwnerMultiFunction()
        console.log(checkOwnerMulti)
        const checkOwnerDirectFunction =
            flashdirecttest.getFunction('checkOwner')
        const checkOwnerDirect = await checkOwnerDirectFunction()
        console.log(checkOwnerDirect)
        // }
        // async function verify(contractAddress: any, args: any) {
        // 	console.log("Verifying contract: " + contractAddress + "./Please wait...");
        // 	try {
        // 		await run("verify:verify", {
        // 			address: contractAddress,
        // 			constructorArguments: args,
        // 		})
        // 	} catch (error: any) {
        // 		if (error.message.includes("already verified")) {
        // 			console.log("Contract already verified");
        // 		} else {
        // 			console.log("Error: " + error.message);
        // 		}
        // 	};
        // }
    } catch (error: any) {
        console.log('Error in deployFlashTests.ts: ' + error.message)
        console.log(error.message)
    }
}
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
