import { AllV3Pools } from './V3PoolsfromUni'
import { uniswapV3Factory } from '../../../../constants/addresses';
import fs from 'fs';

export async function makePairModule() {
	const allPairs = new AllV3Pools(uniswapV3Factory);
	const pairs = await allPairs.getPools();
	// console.log(pairs)
	// console.log('Pairs: ' + pairs.length);
	// async function makePairModule(validPairs: any[]) {
	//     const allPairs = new AllV2PairsModule(uniswapV2Factory);
	//     const pairs = await allPairs.getPairs();
	//     validPairs.forEach((pair: any) => {
	//         const protocol = pair;//This is incorrect
	//         const factory = `${protocol}`;//This is obviously wrong
	//         const output = `export const ${protocol}Pairs = ${JSON.stringify(validPairs, null, 2)};\n`;
	//         fs.writeFile(`${protocol}Pairs.ts`, output, function (err) {
	//             if (err) return console.log(err);
	//             console.log(`${protocol}Pairs.ts written`);
	//         });
	//     });
	// }
	// makePairModule(pairs);

}
makePairModule();