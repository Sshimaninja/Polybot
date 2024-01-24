import { ethers } from 'ethers';
import { abi as IUniswapFactory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import { uniswapV3Factory } from '../../../../constants/addresses';
import fs from 'fs';
import path from 'path';
/**
 * getAllPools function doesn't exist on univ3 protocol, so I wrote a direct call to the UniswaV3Factory contract emit Pool() function.
 * This function will get all the deployed pools from the UniswapFactory contract.
 * It is more robust than the getAllPools function because it makes a direct call to blockchain history. 
 * It is also compatible with UniswapyFactory, which is a fork of UniswapFactory, with a few minor changes.
 */
export async function getAllPools() {
	const uniswapv3Factories = Object.values(uniswapV3Factory);
	const uniswapv3FactoryNames = Object.keys(uniswapV3Factory);
	for (const exchange of uniswapv3Factories) {
		const exchangeName = uniswapv3FactoryNames[uniswapv3Factories.indexOf(exchange)];
		let deployedPool: any = {
			poolID: '',
			token0ID: '',
			token1ID: '',
			block: 0x015F3B7B,
		};
		let deployedPools = [deployedPool];
		const fileName = `all${exchangeName}.json`;
		const filePath = path.join(`./data/allPairs/v3/${fileName}`);
		//If file exists, read it and assign it to the deployedPools array, else create it.
		let startBlock = 0x015F3B7B; // 22757547 factory block deployed
		if (fs.existsSync(filePath)) {
			let deployedPools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			let filelength = deployedPools.length;
			startBlock = deployedPools[filelength - 1].block;
			console.log(`File ${fileName} read successfully. Current block number: ${startBlock}`);
		} else {
			console.log(`File ${fileName} not found. Creating new file.`);
			fs.writeFileSync(filePath, JSON.stringify(deployedPool), 'utf8');
			let deployedPools: any[] = [deployedPool];
		}

		console.log('exchangeName', exchangeName)
		const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/5369330cf67d468998ee44fb7b47b8a3")
		const factory = new ethers.Contract(exchange, IUniswapFactory, provider);

		// Get a list of all filters if you want to see what is available
		// const filter = factory.filters;
		// console.log('filter', filter)
		// console.log(factory.interface)

		const currentBlock = await provider.getBlockNumber();

		async function joinDeployed() {
			const deployedPools: any[] = [];

			for (let i = startBlock; i < currentBlock; i += 0x2710) {
				const filter = factory.filters.PoolCreated();
				const events = await factory.queryFilter(filter, startBlock, i);

				const deployedBatch = events.map((event: any) => {
					let batch = {
						poolID: event.args.pool,
						token0ID: event.args.token0,
						token1ID: event.args.token1,
						block: event.blockNumber,
					};
					return batch;
				});
				console.log('deployedBatch', deployedBatch)
				deployedPools.push(...deployedBatch);
				fs.writeFileSync(`./data/allPairs/V3/all${exchangeName}.json`, JSON.stringify(deployedPools), 'utf8');
			}
			console.log('deployedPools', deployedPools.length);
		}
		const deployed = await joinDeployed();

		// fs.writeFile(`./data/allPairs/V3/all${exchangeName}.json`, JSON.stringify(deployed), 'utf8', (err: any) => {
		// 	if (err) throw err;
		// 	console.log(`File all${exchangeName}.json written successfully.`);
		// });
		console.log(deployed);
	}

}

getAllPools();