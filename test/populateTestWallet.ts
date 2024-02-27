import { signer, provider } from "../constants/provider";
import { ethers } from "ethers";
import { MATIC, wmatic } from "../constants/environment";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { uniswapV2Exchange } from "../constants/addresses";

export type GasToken = { [gasToken: string]: string };

export const gasTokens: GasToken = {
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    ETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WETH: "0x95D7632E9f183b47FCe7BD3518bDBf3E35e25eEF",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    GHST: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
};

export async function populateTestWallet() {
    const signerAddress = signer.address;
    console.log("Signer address: ", signerAddress);
    const maticBalance: bigint = await MATIC.balanceOf(signerAddress);
    console.log("MATIC balance: ", maticBalance);
    console.log("Gas tokens: ", gasTokens);
    let amount = maticBalance / BigInt(Object.keys(gasTokens).length);
    let wmaticID = await wmatic.getAddress();
    const wmaticContract = new ethers.Contract(wmaticID, IERC20, signer);

    // Deposit MATIC and mint WMATIC
    await signer.sendTransaction({
        to: wmaticContract,
        value: (maticBalance * 80n) / 100n,
    });
    console.log("WMATIC balance: ", await wmaticContract.balanceOf(signerAddress));

    for (const tokenAddress of Object.values(gasTokens)) {
        if (tokenAddress !== gasTokens.WMATIC) {
            console.log("Token: ", tokenAddress);
            const maticID = await MATIC.getAddress();
            const tokenContract = new ethers.Contract(tokenAddress, IERC20, signer);
            await tokenContract.approve(uniswapV2Exchange.QUICK.router, amount);
            const quickRouter = new ethers.Contract(
                uniswapV2Exchange.QUICK.router,
                IUniswapV2Router02,
                signer,
            );
            const swap = await quickRouter.swapExactTokensForTokens(
                amount,
                0,
                [wmaticID, tokenAddress],
                signerAddress,
                Date.now() + 1000 * 60 * 5,
            );
            await swap.wait();
            console.log("Token balance: ", await tokenContract.balanceOf(signerAddress));
        }
    }
}
populateTestWallet().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
