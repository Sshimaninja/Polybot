
// import { ethers } from 'ethers';
// import { liveProvider } from '../../../constants/contract';



// const targetDate = new Date('2023-10-23T22:00:00');
// const timestamp = Math.floor(targetDate.getTime() / 1000); // Convert to seconds


// export async function getBlockNumberByTimestamp(timestamp: number, provider: { getBlockNumber: (arg0: any) => any; }) {
// 	try {
// 		const blockNumber = await provider.getBlockNumber(timestamp);
// 		return blockNumber;
// 	} catch (error) {
// 		console.error('Error:', error);
// 		return null;
// 	}
// }

// getBlockNumberByTimestamp(timestamp, liveProvider)
// 	.then((blockNumber) => {
// 		if (blockNumber !== null) {
// 			console.log(`Block number at ${timestamp}: ${blockNumber}`);
// 		} else {
// 			console.log('Failed to retrieve the block number.');
// 		}
// 	});
