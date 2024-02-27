import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { provider, signer } from "../../constants/provider";
import {
    abi as ISwapSingleTest,
    bytecode as swapSingleTestBytecode,
} from "../../artifacts/contracts/v2/SwapSingleTest.sol/SwapSingleTest.json";

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
async function deploySwapSingle() {
    try {
        console.log("Deploying swapSingle with the account: ", signer);

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(signer);

        console.log("Account balance:", balanceDeployer.toString());

        const SwapSingleTestFactory = new ethers.ContractFactory(
            ISwapSingleTest,
            swapSingleTestBytecode,
            signer,
        );
        console.log("Deploying swapSingleTest to ...");
        const flashmultitest = await SwapSingleTestFactory.deploy(signer);
        console.log("awaiting swapSingleTest.deployed()...");
        await flashmultitest.waitForDeployment();
        const swapSingleTestAddress = await flashmultitest.getAddress();
        console.log("Contract 'swapSingleTest' deployed: " + swapSingleTestAddress);
        if (swapSingleTestAddress !== process.env.FLASH_MULTI) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const swapSingleContract = new ethers.Contract(
            swapSingleTestAddress,
            ISwapSingleTest,
            provider,
        );
        const checkOwnerSingle = await swapSingleContract.checkOwner();

        console.log(checkOwnerSingle);

        console.log("Deploying flashSingle with the account: ", signer);
    } catch (error: any) {
        console.log("Error in deployFlashTests.ts:", error.message);
    }
}

deploySwapSingle().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
