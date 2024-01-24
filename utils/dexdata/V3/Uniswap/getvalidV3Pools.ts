import { ethers } from 'ethers';
import { abi as IERC20 } from '../../../../interfaces/IERC20.json';
import { abi as IUniswapV3Pool } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as IUniswapV3Factory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import { uniswapV3Factory } from '../../../../constants/addresses';
import { wallet } from '../../../../constants/contract';
import fs from 'fs';
import path from 'path';
import { Token as V3Token, sqrt } from '@uniswap/sdk-core';
import { DeployedPools } from '../../../../constants/interfaces';
import { chainID } from '../../../../constants/addresses';
/**
 * getAllPools function doesn't exist on univ3 protocol, so I wrote a direct call to the UniswaV3Factory contract emit Pool() function.
 * This function will get all the deployed pools from the UniswapV3Factory contract.
 * It is more robust than the getAllPools function because it makes a direct call to blockchain history. 
 * It is also compatible with AlgebrayFactory, which is a fork of UniswapV3Factory, with a few minor changes.
 */

export async function getAllV3Pools() {
	const uniswapV3Factories = Object.values(uniswapV3Factory);
	const uniswapV3FactoryNames = Object.keys(uniswapV3Factory);

	for (const exchange of uniswapV3Factories) {
		const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/ae479bfaa1b54326a4770a0fe8aa801d")
		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-")
		const blockNumber = await provider.getBlockNumber();
		const factory = new ethers.Contract(exchange, IUniswapV3Factory, provider);

		const exchangeName = uniswapV3FactoryNames[uniswapV3Factories.indexOf(exchange)];
		const fileName = `${exchangeName}.json`;
		const filePath = path.join(`./data/validPairs/v3/${fileName}`);

		let deployedPools: DeployedPools[] = [];
		let lastBlockNumber = 0x015F3B7B; // 22757547 v3factory block deployed

		if (fs.existsSync(filePath)) {
			const fileContents = fs.readFileSync(filePath, 'utf8');
			if (fileContents.trim() !== '') {
				deployedPools = JSON.parse(fileContents);
				lastBlockNumber = deployedPools[deployedPools.length - 1].block;
				console.log(`File ${fileName} read successfully. Current block number: `, lastBlockNumber);
			}
		}

		console.log(">>Starting from block number: " + lastBlockNumber++ + "<<");
		console.log('check contract init factory.getAddress()', factory.getAddress(), 'blockNumber', blockNumber)

		const batchSize = 1000;
		const startBlock = lastBlockNumber + 1;
		const endBlock = blockNumber;
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
				let parsedEvent = factory.interface.parseLog(event);
				// console.log('parsedEvent', parsedEvent);
				if (
					parsedEvent.args.pool !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
					parsedEvent.args.pool !== undefined &&
					parsedEvent.args.token0 !== undefined &&
					parsedEvent.args.token1 !== undefined
				) {
					console.log('>>>parsedEvent.args.pool', parsedEvent.args.pool)
					let pool = new ethers.Contract(parsedEvent.args.pool, IUniswapV3Pool, wallet);
					let liquidity = await pool.liquidity();
					if (liquidity.gt(10000)) {
						console.log('>>>LIQUIDITY.GT(10K)', parsedEvent.args.pool, " Liquidity: ", liquidity.toString())
						let deployedPool: DeployedPools = {
							poolID: parsedEvent.args.pool,
							token0: parsedEvent.args.token0,
							token1: parsedEvent.args.token1,
							fee: parsedEvent.args.fee,
							tickSpacing: parsedEvent.args.tickSpacing,
							block: event.blockNumber,
						};
						deployedPools.push(deployedPool);
						const newPools = deployedPools.slice(-1);
						if (newPools.length > 0) {
							const fileContents = JSON.stringify(deployedPools);
							const formattedContents = fileContents.replace(/\]\[/g, ',');
							fs.writeFileSync(filePath, formattedContents, 'utf8');
						}
					}
				}
			});
		}
	}
}
getAllV3Pools();
