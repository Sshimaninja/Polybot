import { ethers as eh, run, network } from 'hardhat'
require('dotenv').config()
import { Environment } from '../constants/environment'

// npx hardhat run --network localhost scripts/deployFlashMulti.ts
// npx hardhat run --network localhost scripts/deployFlashDirect.ts; npx hardhat run--network localhost scripts/deployFlashMulti.ts
async function main() {
    try {
        const env = new Environment()
        const deployer = (await env.getWallet()).signer
        const owner = await deployer.getAddress()
        const provider = env.provider

        console.log(
            'Deploying contracts with the account: ' + deployer.getAddress()
        )

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(deployer.getAddress())

        console.log('Account balance:', balanceDeployer.toString())

        const flashMulti = await eh.getContractFactory('flashMulti')
        // const flashDirect = await ethers.getContractFactory(
        // 	'flashDirect'
        // );
        console.log('Deploying flashMulti to ' + network.name + '...')
        const flashmulti = await flashMulti.deploy(owner)
        // console.log('Deploying flashDirect to ' + network.name + '...')
        // const flashdirect = await flashDirect.deploy(owner);
        console.log('awaiting flashMulti.deployed()...')
        await flashmulti.waitForDeployment()
        // console.log("awaiting flashDirect.deployed()...")
        // await flashdirect.waitForDeployment();
        console.log(
            "Contract 'flashMulti' deployed: " + (await flashmulti.getAddress())
        )
        // console.log("Contract 'flashDirect' deployed: " + flashdirect.getAddress());

        if (network.config.chainId === 137 && process.env.POLYGONSCAN_APIKEY) {
            await flashmulti.waitForDeployment()
            await verify(flashmulti.getAddress(), [owner])
        } else if (network.config.chainId === 31337) {
            console.log('Not verified: Network is Hardhat')
        }
        const checkOwnerMultiFunction = flashmulti.getFunction('checkOwner')
        const checkOwnerMulti = await checkOwnerMultiFunction()
        console.log(checkOwnerMulti)
        // const checkOwnerDirect = await flashdirect.checkOwner();
        // console.log(checkOwnerDirect)

        async function verify(contractAddress: any, args: any) {
            console.log(
                'Verifying contract: ' +
                    contractAddress +
                    ' with args: ' +
                    JSON.stringify(args) +
                    '. Please wait...'
            )
            try {
                await run('verify:verify', {
                    address: contractAddress,
                    constructorArguments: args,
                })
            } catch (error: any) {
                if (error.message.includes('already verified')) {
                    console.log('Contract already verified')
                } else {
                    console.log('Error: ' + error.message)
                }
            }
        }
    } catch (error: any) {
        console.log(error.message)
    }
}
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
