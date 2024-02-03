import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { provider, signer } from "../../constants/provider";
import {
    abi as flashMultiAbi,
    bytecode as flashMultiBytecode,
} from "../../artifacts/contracts/v2/flashMulti.sol/flashMulti.json";

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
async function main() {
    try {
        console.log("Deploying contracts with the account: ", signer);

        // Get balance of deployer account
        const balanceDeployer = await provider.getBalance(signer);

        console.log("Account balance:", balanceDeployer.toString());
        const ownerAddress = await signer.getAddress();
        console.log("Owner address: ", ownerAddress);
        const FlashMultiFactory = new ethers.ContractFactory(flashMultiAbi, flashMultiBytecode, signer);
        console.log("Deploying flashMulti to ...");
        const flashmulti = await FlashMultiFactory.deploy(ownerAddress);
        console.log("awaiting flashMulti.deployed()...");
        await flashmulti.waitForDeployment();
        const flashMultiAddress = await flashmulti.getAddress();
        console.log("Contract 'flashMulti' deployed: " + flashMultiAddress);
        if (flashMultiAddress !== process.env.FLASH_MULTI) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const flashMultiContract = new ethers.Contract(flashMultiAddress, flashMultiAbi, provider);
        const checkOwnerMulti = await flashMultiContract.checkOwner();

        console.log(checkOwnerMulti);
    } catch (error: any) {
        console.log("Error in deployFlashs.ts:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
