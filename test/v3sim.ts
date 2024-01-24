import { ethers } from 'ethers';
import { FlashParams, FlashCallbackData } from './types';

class ArbitrageSimulator {
    private readonly provider: ethers.JsonRpcProvider;
    private readonly signer: ethers.Signer;
    private readonly pairFlash: ethers.Contract;

    constructor(providerUrl: string, privateKey: string, pairFlashAddress: string) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.pairFlash = new ethers.Contract(pairFlashAddress, PairFlash.abi, this.signer);
    }

    async simulateArbitrage(params: FlashParams): Promise<void> {
        // Get the current balances of the tokens
        const token0 = new ethers.Contract(params.token0, IERC20.abi, this.provider);
        const token1 = new ethers.Contract(params.token1, IERC20.abi, this.provider);
        const balance0Before = await token0.balanceOf(this.signer.getAddress());
        const balance1Before = await token1.balanceOf(this.signer.getAddress());

        // Call the initFlash function to start the flash swap
        const flashTx = await this.pairFlash.initFlash(params);

        // Wait for the flash swap to complete
        const flashReceipt = await flashTx.wait();

        // Decode the callback data from the flash swap
        const callbackData = ethers.defaultAbiCoder.decode(['bytes'], flashReceipt.logs[0].data)[0];
        const decodedData = ethers.defaultAbiCoder.decode(['tuple(uint256,uint256,bytes)'], callbackData)[0].data;

        // Call the uniswapV3FlashCallback function with the decoded callback data
        const callbackTx = await this.pairFlash.uniswapV3FlashCallback(decodedData);

        // Wait for the callback to complete
        await callbackTx.wait();

        // Get the final balances of the tokens
        const balance0After = await token0.balanceOf(this.signer.getAddress());
        const balance1After = await token1.balanceOf(this.signer.getAddress());

        // Calculate the profits from the arbitrage
        const profit0 = balance0After.sub(balance0Before);
        const profit1 = balance1After.sub(balance1Before);

        console.log(`Arbitrage completed successfully!`);
        console.log(`Profit from ${params.token0}: ${fu(profit0, params.decimals0)}`);
        console.log(`Profit from ${params.token1}: ${fu(profit1, params.decimals1)}`);
    }
}