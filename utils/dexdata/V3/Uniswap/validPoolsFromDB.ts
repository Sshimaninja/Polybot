import { ethers } from 'ethers';
import { abi as IUniswapV3Pool } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as IUniswapV3Factory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import { uniswapV3Factory } from '../../../../constants/addresses';
import { provider } from '../../../../constants/contract';
import fs from 'fs';
import path from 'path';
import { Valid3Pool } from '../../../../constants/interfaces';
/**
 * getAllPools function doesn't exist on univ3 protocol, so I wrote a direct call to the UniswaV3Factory contract emit Pool() function.
 * This function will get all the deployed pools from the UniswapV3Factory contract.
 * It is more robust than the getAllPools function because it makes a direct call to blockchain history. 
 * It is also compatible with AlgebrayFactory, which is a fork of UniswapV3Factory, with a few minor changes.
 */

export async function validateUni3Pools() {

	const uniswapV3Factories = Object.values(uniswapV3Factory);
	// console.log('uniswapV3Factories', uniswapV3Factories)
	const uniswapV3FactoryNames = Object.keys(uniswapV3Factory);
	// console.log('uniswapV3FactoryNames', uniswapV3FactoryNames)
	// Load the last recorded block number from a file

	for (const exchange of uniswapV3Factories) {

		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/ae479bfaa1b54326a4770a0fe8aa801d")
		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-")
		const blockNumber = await provider.getBlockNumber();
		const factory = new ethers.Contract(exchange, IUniswapV3Factory, provider);

		const exchangeName = uniswapV3FactoryNames[uniswapV3Factories.indexOf(exchange)];

		const fileName = `${exchangeName}.json`;
		const filePath = path.join(`./data/validPairs/v3/${fileName}`);
		//If file exists, read it and assign it to the deployedPools array, else create it.
		let lastBlockNumber = 0x015F3B7B; // 22757547 factory block deployed
		if (fs.existsSync(filePath)) {
			let deployedPools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			const fileLen = deployedPools.length;
			lastBlockNumber = deployedPools[fileLen - 1].block;
			console.log(`File ${fileName} read successfully. Current block number: ${deployedPools[deployedPools.length].block}`);


			console.log(">>Starting from block number: " + lastBlockNumber++ + "<<");

			console.log('check contract init factory.getAddress()', factory.getAddress(), 'blockNumber', blockNumber)

			const validPools = deployedPools.filter(async (pool: any) => {
				const v3Pool = new ethers.Contract(pool.poolID, IUniswapV3Pool, provider);
				// const t0 = new ethers.Contract(parsedEvent.args.token0, IERC20, provider);
				// const t1 = new ethers.Contract(parsedEvent.args.token1, IERC20, provider);
				// const dec0 = await t0.decimals();
				// const dec1 = await t1.decimals();
				// const token0 = new V3Token(chainID.POLYGON, await pool.token0(), dec0, await t0.symbol());
				// const token1 = new V3Token(chainID.POLYGON, await pool.token1(), dec1, await t1.symbol());
				const liquidity = await v3Pool.liquidity();
				if (liquidity.gt(10000)) {
					let validPool: Valid3Pool = {
						poolID: pool.poolID,
						token0: pool.token0,
						token1: pool.token1,
						fee: pool.fee,
						tickSpacing: pool.tickSpacing,
						block: pool.block,
					};
					deployedPools.push(validPool);
					fs.appendFileSync(filePath, JSON.stringify(deployedPools) + '\n');
				}
			});
			console.log('deployedPools', validPools);
		};

	}
}

validateUni3Pools();
