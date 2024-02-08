import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { provider, signer } from "../../constants/provider";
import {
    abi as flashMultiTestAbi,
    bytecode as flashMultiTestBytecode,
} from "../../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json";
import {
    abi as flashDirectTestAbi,
    bytecode as flashDirectTestBytecode,
} from "../../artifacts/contracts/v2/flashDirectTest.sol/flashDirectTest.json";

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

        console.log("Deploying flashDirect with the account: ", signer);

        const FlashDirectTestFactory = new ethers.ContractFactory(
            flashDirectTestAbi,
            flashDirectTestBytecode,
            signer,
        );
        console.log("Deploying flashDirectTest to ...");
        const flashdirecttest = await FlashDirectTestFactory.deploy(signer);
        console.log("awaiting flashDirectTest.deployed()...");
        await flashdirecttest.waitForDeployment();
        const flashDirectTestAddress = await flashdirecttest.getAddress();
        console.log("Contract 'flashDirectTest' deployed: " + flashDirectTestAddress);
        if (flashDirectTestAddress !== process.env.FLASH_MULTI) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const flashDirectContract = new ethers.Contract(
            flashDirectTestAddress,
            flashDirectTestAbi,
            provider,
        );
        const checkOwnerDirect = await flashDirectContract.checkOwner();

        console.log(checkOwnerDirect);
    } catch (error: any) {
        console.log("Error in deployFlashTests.ts:", error.message);
    }
}

deployMulti().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
