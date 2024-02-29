import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { provider, signer } from "../../constants/provider";
import {
    abi as ISwapSingle,
    bytecode as swapSingleBytecode,
} from "../../artifacts/contracts/v2/SwapSingle.sol/SwapSingle.json";

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
async function deploySwapSingle() {
    try {
        console.log("Deploying swapSingle with the account: ", signer);

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(signer);

        console.log("Account balance:", balanceDeployer.toString());

        const SwapSingleFactory = new ethers.ContractFactory(
            ISwapSingle,
            swapSingleBytecode,
            signer,
        );
        console.log("Deploying swapSingle to ...");
        const swapsingle = await SwapSingleFactory.deploy(signer);
        console.log("awaiting swapSingle.deployed()...");
        await swapsingle.waitForDeployment();
        const swapSingleAddress = await swapsingle.getAddress();
        console.log("Contract 'swapSingle' deployed: " + swapSingleAddress);
        if (swapSingleAddress !== process.env.FLASH_MULTI) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const swapSingleContract = new ethers.Contract(swapSingleAddress, ISwapSingle, provider);
        const checkOwnerSingle = await swapSingleContract.checkOwner();

        console.log(checkOwnerSingle);

        console.log("Deploying flashSingle with the account: ", signer);
    } catch (error: any) {
        console.log("Error in deployFlashs.ts:", error.message);
    }
}

deploySwapSingle().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
