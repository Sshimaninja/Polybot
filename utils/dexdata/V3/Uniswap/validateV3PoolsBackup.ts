import { ethers } from 'ethers';
import { abi as IERC20 } from '../../../../interfaces/IERC20.json';
import { abi as IUniswapV3Pool } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as IUniswapV3Factory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import { uniswapV3Factory } from '../../../../constants/addresses';
import { wallet } from '../../../../constants/contract';
import fs from 'fs';
import path from 'path';
import { Token as V3Token } from '@uniswap/sdk-core';
import { DeployedPools } from '../../../../constants/interfaces';
import { chainID } from '../../../../constants/addresses';
/**
 * getAllPools function doesn't exist on univ3 protocol, so I wrote a direct call to the UniswaV3Factory contract emit Pool() function.
 * This function will get all the deployed pools from the UniswapV3Factory contract.
 * It is more robust than the getAllPools function because it makes a direct call to blockchain history. 
 * It is also compatible with AlgebrayFactory, which is a fork of UniswapV3Factory, with a few minor changes.
 */

export async function getAllV3Pools() {

	let deployedPools: DeployedPools[] = [{
		poolID: '',
		token0: '',
		token1: '',
		fee: 0,
		tickSpacing: 0,
		block: 0x015F3B7B
	} //<==add new deployedPool objects here
	];
	const uniswapV3Factories = Object.values(uniswapV3Factory);
	// console.log('uniswapV3Factories', uniswapV3Factories)
	const uniswapV3FactoryNames = Object.keys(uniswapV3Factory);
	// console.log('uniswapV3FactoryNames', uniswapV3FactoryNames)
	// Load the last recorded block number from a file

	for (const exchange of uniswapV3Factories) {

		const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/ae479bfaa1b54326a4770a0fe8aa801d")
		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-")
		const blockNumber = await provider.getBlockNumber();
		const factory = new ethers.Contract(exchange, IUniswapV3Factory, provider);

		const exchangeName = uniswapV3FactoryNames[uniswapV3Factories.indexOf(exchange)];

		const fileName = `${exchangeName}.json`;
		const filePath = path.join(`./data/validPairs/v3/${fileName}`);
		//If file exists, read it and assign it to the deployedPools array, else create it.
		let lastBlockNumber = 0x015F3B7B; // 22757547 factory block deployed
		if (fs.existsSync(filePath)) {
			deployedPools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			lastBlockNumber = deployedPools[deployedPools.length - 1].block;
			console.log(`File ${fileName} read successfully. Current block number: ${deployedPools[deployedPools.length].block}`);
		} else {
			fs.writeFileSync(filePath, JSON.stringify(deployedPools), 'utf8');
		}

		console.log(">>Starting from block number: " + lastBlockNumber++ + "<<");

		console.log('check contract init factory.getAddress()', factory.getAddress(), 'blockNumber', blockNumber)


		const batchSize = 1000;
		const startBlock = 0x015F3B7B; // 22757547 
		const endBlock = blockNumber; // 
		const numBatches = Math.ceil((endBlock - startBlock) / batchSize);

		for (let i = 0; i < numBatches; i++) {
			const fromBlock = startBlock + i * batchSize;
			const toBlock = Math.min(fromBlock + batchSize - 1, endBlock);
			const filter = {
				address: factory.getAddress(),
				fromBlock,
				toBlock,
				topics: [factory.interface.getEventTopic('PoolCreated')],
			};

			const events = await provider.getLogs(filter);
			events.map(async (event) => {
				const parsedEvent = factory.interface.parseLog(event);
				console.log('parsedEvent', parsedEvent);
				if (
					parsedEvent.args.pool !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
					parsedEvent.args.pool !== undefined &&
					parsedEvent.args.token0 !== undefined &&
					parsedEvent.args.token1 !== undefined
				) {
					console.log('parsedEvent.args.pool', parsedEvent.args.pool)
					const pool = new ethers.Contract(parsedEvent.args.pool, IUniswapV3Pool, wallet);
					// const t0 = new ethers.Contract(parsedEvent.args.token0, IERC20, provider);
					// const t1 = new ethers.Contract(parsedEvent.args.token1, IERC20, provider);
					// const dec0 = await t0.decimals();
					// const dec1 = await t1.decimals();
					// const token0 = new V3Token(chainID.POLYGON, await pool.token0(), dec0, await t0.symbol());
					// const token1 = new V3Token(chainID.POLYGON, await pool.token1(), dec1, await t1.symbol());
					const liquidity = await pool.liquidity();
					if (liquidity.gt(10000)) {
						let deployedPool: DeployedPools = {
							poolID: parsedEvent.args.pool,
							token0: parsedEvent.args.token1,
							token1: parsedEvent.args.token1,
							fee: parsedEvent.args.fee,
							tickSpacing: parsedEvent.args.tickSpacing,
							block: event.blockNumber,
						};
						deployedPools.push(deployedPool);
						fs.appendFileSync(filePath, JSON.stringify(deployedPools) + '\n');
						// fs.appendFileSync(filePath, JSON.stringify(deployedPool) + '\n');

					}
				}
			});
		}
		console.log('deployedPools', deployedPools)
		//Append deployedPools to DeployedPools object in .json file

	}

}
getAllV3Pools();
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>MIND	 BELOW

// // Possibly useful later, but apparently not useful just now.
// const tick = TickMath.getTickAtSqrtRatio(slot0.sqrtRatioX96);
// const tickProvider = new TickProvider(v3Pool);

// Seems that populating the database with contract instances was too much for the script to handle, maybe.I'm simplyfing this and will assign contracts as necesasry.

// Also, I need to see if I can make this script write the pools to file as they are queried from the chain, and then make it start from the last queried deployedpool in the UNI.json doc(using the included 'block' property of DeployedPools), instead of the

// Can this happen ?