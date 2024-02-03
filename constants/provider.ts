import { config as dotenvConfig } from "dotenv";
import { ethers } from "ethers";
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });

console.log("CURRENT RPC SETTINGS: ", "NODE_ENV: ", process.env.NODE_ENV, "RPC: ", process.env.RPC);
export const provider = new ethers.JsonRpcProvider(process.env.RPC, undefined, {
    staticNetwork: true,
});
if (process.env.PRIVATE_KEY === undefined) {
    throw new Error("No private key set in .env file");
}
export const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

export const signer = wallet.connect(provider);

export async function checkProvider() {
    // console.log('Ready?: ', provider.ready)
    const check = await provider.getBlock("latest");
    const num = await provider.getBlockNumber();
    const fee = await provider.getFeeData();
    console.log("CHECK PROVIDER: ");
    console.log("BLOCKNUMER: ", num);
    console.log("FEES: ", fee);
}
checkProvider();
