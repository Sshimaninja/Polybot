import { ethers } from 'ethers';
import { abi as IAlgebraFactory } from '../../../../interfaces/IAlgebraFactory.json'
import { algebraFactory } from '../../../../constants/addresses';
import fs from 'fs';
/**
 * getAllPools function doesn't exist on univ3 protocol, so I wrote a direct call to the UniswaV3Factory contract emit Pool() function.
 * This function will get all the deployed pools from the AlgebraFactory contract.
 * It is more robust than the getAllPools function because it makes a direct call to blockchain history. 
 * It is also compatible with AlgebrayFactory, which is a fork of AlgebraFactory, with a few minor changes.
 */
export async function getAllPools() {
	const algebraFactories = Object.values(algebraFactory);
	const algebraFactoryNames = Object.keys(algebraFactory);
	for (const exchange of algebraFactories) {
		const exchangeName = algebraFactoryNames[algebraFactories.indexOf(exchange)];
		console.log('exchangeName', exchangeName)
		const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/5369330cf67d468998ee44fb7b47b8a3")
		const factory = new ethers.Contract(exchange, IAlgebraFactory, provider);

		const filter = factory.filters.Pool();
		const events = await factory.queryFilter(filter);

		const deployedPools = events.map((event: any) => {
			// console.log('event', event)
			return {
				poolID: event.args.pool,
				token0ID: event.args.token0,
				token1ID: event.args.token1,
				block: event.blockNumber,
			};
		});
		fs.writeFile(`./data/allPairs/V3/all${exchangeName}.json`, JSON.stringify(deployedPools), 'utf8', (err: any) => {
			if (err) throw err;
			console.log(`File all${exchangeName}.json written successfully.`);
		});
		console.log(deployedPools);
	}

}
getAllPools();