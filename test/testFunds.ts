import { provider } from "../constants/provider";
import { config as dotenvConfig } from "dotenv";
import { NonceManager, Signer, ethers } from "ethers";
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });
import { MATIC, wmatic } from "../constants/environment";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { uniswapV2Exchange } from "../constants/addresses";

export type GasToken = { [gasToken: string]: string };

export const gasTokens: GasToken = {
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    ETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    GHST: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
};
const testkey = process.env.TEST_KEY;
if (testkey === undefined) {
    throw new Error("No test wallet set in .env file");
}
const wallet = new ethers.Wallet(testkey, provider);
const signer: Signer = new NonceManager(wallet);
// const signer = wallet.connect(provider);
const wmaticContract = new ethers.Contract(gasTokens.WMATIC, IERC20, signer);
const quickRouter = new ethers.Contract(uniswapV2Exchange.QUICK.router, IUniswapV2Router02, signer);

export async function getTokens() {
    await wrapWmatic();
    const wmaticBalance: bigint = await wmaticContract.balanceOf(await signer.getAddress());
    console.log("WMATIC balance: ", wmaticBalance);
    if (wmaticBalance > 0n) {
        const swapTokens = await swap();
        console.log("Swap successful. Amount out: ", swapTokens);
    }
}
getTokens();

export async function wrapWmatic() {
    const quickRouter = new ethers.Contract(
        uniswapV2Exchange.QUICK.router,
        IUniswapV2Router02,
        provider,
    );
    const signerAddress = await signer.getAddress();
    console.log("Signer address: ", signerAddress);
    const maticBalance = await provider.getBalance(signerAddress);
    console.log("MATIC balance: ", maticBalance);
    const maticSend = (maticBalance * 90n) / 100n;
    // Deposit MATIC and mint WMATIC
    async function wrap() {
        const wrap = await signer.sendTransaction({
            to: wmaticContract,
            value: maticSend,
        });
        await wrap.wait();
        console.log("Wrap transaction: ", wrap.blockHash);
        console.log("WMATIC balance: ", await wmaticContract.balanceOf(signerAddress));
    }
    await wrap();
}

export async function swap(): Promise<bigint[]> {
    const signerAddress = signer.getAddress();
    let nonce = await signer.getNonce();
    console.log("nonce: ", nonce);
    console.log("Signer address: ", signerAddress);
    let tokenBalances: bigint[] = [];
    for (const tokenAddress of Object.values(gasTokens)) {
        if (tokenAddress !== gasTokens.WMATIC) {
            console.log(
                "Token: ",
                tokenAddress,
                "Number of tokens: " + Object.keys(gasTokens).length,
            );
            let tokenBalance: bigint = 0n;
            console.log("Token: ", tokenAddress);
            let wmaticBalance = await wmaticContract.balanceOf(signerAddress);
            let amount = wmaticBalance / BigInt(Object.keys(gasTokens).length);
            const approveWmatic = await wmaticContract.approve(
                uniswapV2Exchange.QUICK.router,
                amount,
            );
            const tokenContract = new ethers.Contract(tokenAddress, IERC20, signer);
            await wmaticContract.approve(uniswapV2Exchange.QUICK.router, wmaticBalance);
            await tokenContract.approve(uniswapV2Exchange.QUICK.router, amount);
            async function swapIt() {
                console.log("sending swap");
                const swap = await quickRouter.swapExactTokensForTokens(
                    amount,
                    0,
                    [gasTokens.WMATIC, tokenAddress],
                    signerAddress,
                    Date.now() + 1000 * 60 * 5,
                    { nonce: nonce++ },
                );
                await swap.wait();
                if (swap) {
                    console.log(
                        "Swap successful. Amount out: ",
                        await tokenContract.balanceOf(signerAddress),
                    );
                }
                console.log("Token balance: ", await tokenContract.balanceOf(signerAddress));
                return swap[1];
            }
            await swapIt();
            tokenBalance = await tokenContract.balanceOf(signerAddress);
            if (tokenBalance > 0n) {
                console.log("Token balance: ", await tokenContract.balanceOf(signerAddress));
                tokenBalances.push(tokenBalance);
            }
            console.log("Token balance: ", tokenBalance);
        }
    }
    return tokenBalances;
}
