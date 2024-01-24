import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
;
// import { abi as IFlash } from '../artifacts/contracts/flasMulti.sol/flashMulti.json';
require("dotenv").config();

import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";

describe("flashSwap", function () {
	const USDCHolder = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
	const flashTestAddress = "0xAa07486C20F73fF4309495411927E6AE7C884DBa";
	// const flashTest = new ethers.Contract(flashTestAddress, IFlash, ethers.provider);
	const loanFactory = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4" //sushi
	const recipientRouter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff" //quick        
	const token0ID = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
	const token1ID = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
	const amount0In = 1000000000; // 1000
	const amount1Out = 100000000; // 1000

	// before(async () => {
	//     const testFlashFactory = await ethers.getContractFactory("flashOne");
	//     var flashOne = await testFlashFactory.deploy();
	//     await flashOne.deployed();
	//     return flashOne;
	// });

	it("Flash swap", async () => {
		// impersonate acc
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [USDCHolder],
		});
		const impersonateSigner = await ethers.getSigner(USDCHolder);

		// Token Borrowed
		const USDCContract = new ethers.Contract(token0ID, IERC20, impersonateSigner)
		const USDCHolderBalance = await USDCContract.balanceOf(impersonateSigner.getAddress())
		console.log(`USDC Holder Balance: ${USDCHolderBalance}`)
		const fee = Math.round(((amount0In * 3) / 997)) + 1;
		await USDCContract.connect(impersonateSigner).transfer(flashTestAddress, fee)
		// await flashTest.flashSwap(
		// 	loanFactory,
		// 	recipientRouter,
		// 	token0ID,
		// 	token1ID,
		// 	amount0In,
		// 	amount1Out
		// )
		// const flashSwapBalance = await USDCContract.balanceOf(flashTest.getAddress())
		// expect(flashSwapBalance.eq(0n)).to.be.true;
	})
})


//     it("Should return the new flashloan amount", async function () {
//         const FlashOne = await ethers.getContractFactory("FlashOne");
//         const flashOne = await FlashOne.deploy();

//         await flashOne.deployed();

//         expect(await flashOne.flashSwap()).to.equal("Hello, world!");
//     });
// });