import { abi as IFactory } from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import { abi as IUniswapV3Factory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import { abi as IUniswapV3Pool } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { Contract } from "ethers";
import { FactoryMap, uniswapV3Factory } from "../../../../constants/addresses";
import { wallet } from "../../../../constants/contract";
import fs from "fs";
/*
NOTE: USE GETVALIDV3POOLS (FILTERED) OR GETALLV3POOLS (UNFILTERED) INSTEAD OF THIS FILE.

Gets uniV3 pools from Valid UniV2 pairs (not most efficient way to do this, but it works)
Use getAlUniv3Pools.ts and filter with validatev3Pools.ts to get valid pools
OR 
use getAllValidV3Pools.ts to get ONLY valid (liq>10K) pools directly because there are LOTS of unfiltered pools.
*/
export class AllV3Pools {
	factoryMap: FactoryMap;

	constructor(factoryMap: FactoryMap) {
		this.factoryMap = factoryMap;
	}

	async getPools(): Promise<any> {
		Object.keys(this.factoryMap).forEach(async (protocol) => {
			console.log('Starting');
			const factoryID = this.factoryMap[protocol];
			console.log('FactoryID: ' + factoryID);
			const factory = new Contract(factoryID, IFactory, wallet);
			if (factory.getAddress() != undefined) {
				console.log('FactoryContract Initialised: ' + factory.getAddress());
			} else {
				console.log('FactoryContract not initialised');
			}
			async function getAllPools(factory: Contract) {
				const uniswapV3Factory = new Contract(factoryID, IUniswapV3Factory, wallet);
				const v3Pools: any[] = [];
				// Read the allV2Pools.json file and extract the token0.id and token1.id values for each pair
				const UNIV3Pools = JSON.parse(fs.readFileSync(`data/validPairs/v2/${protocol}.json`, 'utf8'));
				// Get the corresponding Uniswap V3 pool addresses for each token pair
				UNIV3Pools.forEach(async (entry: any) => {
					await uniswapV3Factory.getPool(entry.token0.id, entry.token1.id, entry.feeTier);
					if (entry.getAddress() != "0x0000000000000000000000000000000000000000") {
						const pool = new Contract(entry.id, IUniswapV3Pool, wallet);
						const v3Pool = {
							ticker: pool.ticker,
							poolID: entry.ddress,
							token0: {
								symbol: pool.token0.symbol,
								id: entry.token0(),
								decimals: pool.token0.decimals,
							},
							token1: {
								symbol: pool.token0.symbol,
								id: pool.token1(),
								decimals: pool.token0.decimals,
							},
							fee: entry.fee,
						};
						v3Pools.push(v3Pool);
					}
				});
				console.log(`Uniswap V3 pairs: ${v3Pools.length}`);
				console.log(v3Pools);
			}
			getAllPools(factory);
		});

	};
}
// Call the function
const allPools = new AllV3Pools(uniswapV3Factory);