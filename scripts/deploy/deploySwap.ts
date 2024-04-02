import { ethers } from "ethers";
import { config as dotEnvConfig } from "dotenv";
import { MATIC } from "../../constants/environment";
import { gasTokens } from "../../constants/addresses";
import { provider, signer } from "../../constants/provider";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import {
    abi as ISwapSingle,
    bytecode as SwapBytecode,
} from "../../artifacts/contracts/v2/swap.sol/Swap.json";
import { fu } from "../modules/convertBN";

dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
async function deploySwapSingle() {
    try {
        let signerID = await signer.getAddress();
        console.log("Deploying Swap with the account: ", signer);

        // Get balance of deployer account
        for (let token in gasTokens) {
            console.log("Token:", token);
            console.log("Address:", gasTokens[token]);
            const contract = new ethers.Contract(
                gasTokens[token],
                IERC20,
                provider,
            );
            const tokenBalance = await contract.balanceOf(signerID);
            console.log("Token balance:", fu(tokenBalance, 18));
        }
        const balanceDeployer = await provider.getBalance(signerID);
        const maticBalance = await MATIC.balanceOf(signerID);
        console.log("Account balance:", fu(balanceDeployer, 18));
        console.log("MATIC balance:", fu(maticBalance, 18));

        const SwapSingleFactory = new ethers.ContractFactory(
            ISwapSingle,
            SwapBytecode,
            signer,
        );
        console.log("Deploying Swap to ...");
        const swap = await SwapSingleFactory.deploy(signer);
        console.log("awaiting Swap.deployed()...");
        await swap.waitForDeployment();
        const SwapAddress = await swap.getAddress();
        console.log("Contract 'Swap' deployed: " + SwapAddress);
        if (SwapAddress !== process.env.SWAP_SINGLE) {
            console.log(
                "Contract address does not match .env file. Please update .env file with new contract address.",
            );
        }
        const SwapContract = new ethers.Contract(
            SwapAddress,
            ISwapSingle,
            provider,
        );
        const checkOwnerSingle = await SwapContract.checkOwner();

        console.log(checkOwnerSingle);

        console.log("Deploying Swap with the account: ", signer);
    } catch (error: any) {
        console.log("Error in deploySwapSingle.ts:", error.message);
    }
}

deploySwapSingle().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
