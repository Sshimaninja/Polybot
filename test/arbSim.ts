import { ethers } from "hardhat";
import hre from 'hardhat'
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapV2Router } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json"
import { uniswapV2Router } from "../constants/addresses";

import { BigInt2BN, fu, pu } from "../scripts/modules/convertBN";
import { transferMaticToInitialSigner } from "./txSigner";

async function arbSim() {
	// Define the ABI for the WMATIC contract
	const WMATIC_ABI = [
		"function approve(address spender, uint256 amount) public override returns (bool)",
		"function deposit() public payable",
		"function withdraw(uint wad) public",
		"function balanceOf(address account) external view returns (uint256)",
	];
	const provider = new ethers.JsonRpcProvider("http://localhost:8545")

	const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider)

	const makeRich = await transferMaticToInitialSigner(signer);


	if (makeRich !== undefined) {
		console.log("MADE RICH")
	}
	else {
		console.log("ERROR IN MAKERICH()")
	}

	const matic = new ethers.Contract("0x0000000000000000000000000000000000001010", IERC20, signer);
	const wmatic = new ethers.Contract("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", WMATIC_ABI, signer);
	const usdc = new ethers.Contract("0x2791bca1f2de4661ed88a30c99a7a9449aa84174", IERC20, signer);

	const quickRouter = new ethers.Contract(uniswapV2Router.QUICK, IUniswapV2Router, signer);

	const gasLimit = await provider.getBlock("latest").then((block) => block?.gasLimit.toString());
	console.log("Gas Limit: ", gasLimit);
	// Convert half of MATIC to WMATIC
	const gasBal = await matic.balanceOf(signer.getAddress());
	// console.log("Balance of MATIC:: ", fu(gasBal, 18));
	const wmaticBal = await wmatic.balanceOf(signer.getAddress());

	async function getWMATIC(): Promise<BigInt | undefined> {
		if (wmaticBal.eq(0)) {
			console.log("Balance of WMATIC is 0!: ", fu(wmaticBal, 18));
			const ninetyFivePercentMatic = gasBal.mul(95).div(100);

			console.log("Approving 95% MATIC spend")
			const maticApprove = await matic.approve(wmatic.getAddress(), ninetyFivePercentMatic, { gasLimit: gasLimit });

			if (maticApprove) console.log("MATIC -> WMATIC APPROVED");
			const wrap = await wmatic.deposit({ value: ninetyFivePercentMatic });
			const reciept = await wrap.wait();
			if (reciept) console.log("MATIC WRAPPED");
			console.log("Reciept: ", reciept.transactionHash);
			return ninetyFivePercentMatic;
		} if (wmaticBal.gt(0)) {
			const ninetyFivePercentMatic = await wmatic.balanceOf(signer.getAddress());
			return ninetyFivePercentMatic;
		} else {
			console.log("Error in getWMATIC()")
			return undefined;
		}
	}

	const ninetyFivePercentMatic = await getWMATIC();

	if (ninetyFivePercentMatic !== undefined) {
		console.log("INITIAL BALANCES: ")
		console.log("Balance of MATIC:: ", fu(await matic.balanceOf(signer.getAddress()), 18));
		console.log("Balance of WMATIC: ", fu(await wmatic.balanceOf(signer.getAddress()), 18));
		console.log("Balance of USDC::: ", fu(await usdc.balanceOf(signer.getAddress()), 6));
		const quickPool = new ethers.Contract("0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827", IUniswapV2Pair, signer);
		// const quickPool = new ethers.Contract("0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827", IUniswapV2Pair, signer);

		// approve the router to spend WMATIC
		const approveWmatic = await wmatic.connect(signer).approve(quickRouter.getAddress(), ninetyFivePercentMatic);
		if (approveWmatic) console.log("WMATIC on QUICKROUTER APPROVED")


		const preTradeReserves = await quickPool.getReserves();
		console.log("Reserves: ", preTradeReserves[0].toString(), preTradeReserves[1].toString());
		const amountOut = await quickRouter.connect(signer).getAmountsOut(ninetyFivePercentMatic, [wmatic.getAddress(), usdc.getAddress()]);

		// Sell a large amount of WMATIC for USDC
		const swap = await quickRouter.connect(signer).swapExactTokensForTokens(
			ninetyFivePercentMatic.toString(), // amountIn
			amountOut[1], // amountOutMin
			[wmatic.getAddress(), usdc.getAddress()], // path
			signer.getAddress(), // to
			Math.floor(Date.now() / 1000) + 60 * 20 // deadline
		);
		await swap.wait(36);
		if (swap) console.log("WMATIC > USDC SWAPPED");
		const postTradeReserves0: bigint = await quickPool.getReserves()[0];
		const postTradeReserves1: bigint = await quickPool.getReserves()[1];
		console.log("New Balance of MATIC:: ", fu(await wmatic.balanceOf(signer.getAddress()), 18));
		console.log("New Balance of WMATIC: ", fu(await wmatic.balanceOf(signer.getAddress()), 18));
		console.log("New Balance of USDC: ", fu(await usdc.balanceOf(signer.getAddress()), 6));
		console.log("New QuickPool Reserves: ", postTradeReserves0.toString(), postTradeReserves1.toString());
	}
}


arbSim()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

/**{
id: '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827',
trade: 'multi',
ticker: 'WMATIC/USDC',
direction: 'A',
tradeSize: '1103.600106991112026744 WMATIC',
loanPool: {
exchange: 'SUSHI',
priceIn: '1.949772772857145064',
priceOut: '0.512880',
reservesIn: '257984.708061820163815265 WMATIC',
reservesOut: '132315.268555 USDC',
amountRepay: '565.292413 USDC',
repaysObj: {
  simpleMulti: '563.603759 USDC',
  getAmountsOut: '561.920128 USDC',
  getAmountsIn: '565.292413 USDC'
}
},
target: {
exchange: 'QUICK',
priceIn: '1.954566099179981663',
priceOut: '0.511623',
reservesIn: '1754846.350465150307485387 WMATIC',
reservesOut: '897818.882258 USDC',
amountOut: '562.580031 USDC'
},
result: {
uniswapkPreT: '34135315930283008517330881883492075',
uniswapkPosT: '34134505727119051606202194183048328',
uniswapKPositive: false,
profit: '-2.712382 USDC',
profperc: '-0.482133%'
}
}
*/



// Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266(10000 ETH)
// Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
