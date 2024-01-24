// import { ethers, Contract } from 'ethers'
// import { PoolInfo } from '../../../constants/interfaces'


// export async function getPoolInfo(poolContract: Contract): Promise<PoolInfo> {

// 	const [token0, token1, fee, tickSpacing, liquidity, slot0] =
// 		await Promise.all([
// 			poolContract.token0(),
// 			poolContract.token1(),
// 			poolContract.fee(),
// 			poolContract.tickSpacing(),
// 			poolContract.liquidity(),
// 			poolContract.slot0(),
// 		])

// 	return {
// 		token0,
// 		token1,
// 		fee,
// 		tickSpacing,
// 		liquidity,
// 		sqrtPriceX96: slot0[0],
// 		tick: slot0[1],
// 	}
// }