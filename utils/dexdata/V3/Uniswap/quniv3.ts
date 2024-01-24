import axios, { AxiosResponse } from 'axios'
import fs from 'fs';
export async function quni() {
	const uniData = async () => {
		var result: AxiosResponse<any, any> | undefined;
		try {
			result = await axios.post(
				'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
				{
					query: `
        {
          pools(
            first: 1000
            orderBy: volumeUSD
            orderDirection: desc
            where: {totalValueLockedUSD_gt: "1000"}
          ) {
            id
            token0 {
              symbol
              id
              decimals
              totalValueLocked
            }
            token1 {
              symbol
              id
              decimals
              totalValueLocked
            }
            token0Price
            token1Price
            totalValueLockedUSD
            feeTier
          }
        }
          `
				}
			);
		} catch (error: any) {
			console.error(error);
			if (error.message.includes('Cannot read properties of undefined (reading')) {
				console.log('Retrying...\nIf error persists, check query syntax.');
				await uniData();
			}
		}
		if (result !== undefined) {
			const unipairs = result.data.data.pools;
			// console.log(unipairs)
			fs.writeFile('./data/validPairs/v3/UNI.json', JSON.stringify(unipairs, null, 4), err => {
				if (err) {
					console.error(err);
				}
				console.log("UNI.json File has been created");
			})
			return unipairs;
		}

	}
	return uniData();
}
quni();
