import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { provider, signer } from "../../constants/provider";
import {
    abi as flashMultiTestAbi,
    bytecode as flashMultiTestBytecode,
} from "../../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json";
import {
    abi as flashSingleTestAbi,
    bytecode as flashSingleTestBytecode,
} from "../../artifacts/contracts/v2/flashSingleTest.sol/flashSingleTest.json";

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
async function deployMulti() {
    try {
        console.log("Deploying flashMulti with the account: ", signer);

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(signer);

        console.log("Account balance:", balanceDeployer.toString());

        const FlashMultiTestFactory = new ethers.ContractFactory(
            flashMultiTestAbi,
            flashMultiTestBytecode,
            signer,
        );
        console.log("Deploying flashMultiTest to ...");
        const flashmultitest = await FlashMultiTestFactory.deploy(signer);
        console.log("awaiting flashMultiTest.deployed()...");
        await flashmultitest.waitForDeployment();
        const flashMultiTestAddress = await flashmultitest.getAddress();
        console.log("Contract 'flashMultiTest' deployed: " + flashMultiTestAddress);
        if (flashMultiTestAddress !== process.env.FLASH_MULTI) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const flashMultiContract = new ethers.Contract(
            flashMultiTestAddress,
            flashMultiTestAbi,
            provider,
        );
        const checkOwnerMulti = await flashMultiContract.checkOwner();

        console.log(checkOwnerMulti);

        console.log("Deploying flashSingle with the account: ", signer);

        const FlashSingleTestFactory = new ethers.ContractFactory(
            flashSingleTestAbi,
            flashSingleTestBytecode,
            signer,
        );
        console.log("Deploying flashSingleTest to ...");
        const flashsingletest = await FlashSingleTestFactory.deploy(signer);
        console.log("awaiting flashSingleTest.deployed()...");
        await flashsingletest.waitForDeployment();
        const flashSingleTestAddress = await flashsingletest.getAddress();
        console.log("Contract 'flashSingleTest' deployed: " + flashSingleTestAddress);
        if (flashSingleTestAddress !== process.env.FLASH_SINGLE) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const flashSingleContract = new ethers.Contract(
            flashSingleTestAddress,
            flashSingleTestAbi,
            provider,
        );
        const checkOwnerSingle = await flashSingleContract.checkOwner();

        console.log(checkOwnerSingle);
    } catch (error: any) {
        console.log("Error in deployFlashTests.ts:", error.message);
    }
}

deployMulti().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
