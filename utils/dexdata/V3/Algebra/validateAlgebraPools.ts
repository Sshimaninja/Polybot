import { ethers } from 'ethers';
import { abi as IAlgebraPool } from '@cryptoalgebra/core/artifacts/contracts/interfaces/IAlgebraPool.sol/IAlgebraPool.json'
import { abi as IAlgebraFactory } from '@cryptoalgebra/core/artifacts/contracts/interfaces/IAlgebraFactory.sol/IAlgebraFactory.json'
import { algebraFactory } from '../../../../constants/addresses';
import { provider } from '../../../../constants/contract';
import fs from 'fs';
import path from 'path';
import { Valid3Pool } from '../../../../constants/interfaces';
/**
Validates pools from DB by filtering by liquidity then mapping with required values
getvalidV3Pools.ts is more robust and restarts from last block in json file, 
and writes json file properly, so you may want to update this doc with that logic.
 */

export async function validateAlgebraPools() {

	const algebraFactories = Object.values(algebraFactory);
	// console.log('algebraFactories', algebraFactories)
	const algebraFactoryNames = Object.keys(algebraFactory);
	// console.log('algebraFactoryNames', algebraFactoryNames)
	// Load the last recorded block number from a file

	for (const exchange of algebraFactories) {

		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/ae479bfaa1b54326a4770a0fe8aa801d")
		// const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-")
		const blockNumber = await provider.getBlockNumber();
		const factory = new ethers.Contract(exchange, IAlgebraFactory, provider);

		const exchangeName = algebraFactoryNames[algebraFactories.indexOf(exchange)];

		const fileName = `all${exchangeName}.json`;
		const filePath = path.join(`./data/allPairs/v3/${fileName}`);
		const allPools = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		console.log('check contract init factory.getAddress()', factory.getAddress(), 'blockNumber', blockNumber)

		const validated = allPools
			.filter(async (pool: any) => {
				const algPool = new ethers.Contract(pool.poolID, IAlgebraPool, provider);
				const liquidity = await algPool.liquidity();
				return liquidity.gt(10000);
			})
			.map(async (pool: any) => {
				// const algPoolOptions = algPool.functions;// in case you want to see what's available
				const algPool = new ethers.Contract(pool.poolID, IAlgebraPool, provider);
				const globalState = await algPool.globalState()
				const tickSpacing = await algPool.tickSpacing()
				let validPool: Valid3Pool = {
					poolID: pool.poolID,
					token0: pool.token0ID,
					token1: pool.token1ID,
					fee: globalState.fee,
					tickSpacing: tickSpacing,
					block: pool.block,
				};
				return validPool;
			});
		const validPools = await Promise.all(validated);
		console.log('validPool', validated)
		fs.writeFile(`./data/validPairs/algebra/${exchangeName}.json`, JSON.stringify(validPools), 'utf8', (err: any) => {
			if (err) throw err;
			console.log(`File ${fileName} written successfully.`);
		});

		console.log('deployedPools', validPools.length);
	};
}

validateAlgebraPools();






// console.log('algPoolOptions', algPoolOptions)
// const t0 = new ethers.Contract(parsedEvent.args.token0, IERC20, provider);
// const t1 = new ethers.Contract(parsedEvent.args.token1, IERC20, provider);
// const dec0 = await t0.decimals();
// const dec1 = await t1.decimals();
// const token0 = new V3Token(chainID.POLYGON, await pool.token0(), dec0, await t0.symbol());
// const token1 = new V3Token(chainID.POLYGON, await pool.token1(), dec1, await t1.symbol());