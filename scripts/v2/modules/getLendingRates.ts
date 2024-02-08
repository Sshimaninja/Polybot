//TODO: Write a function

// import { ethers } from "ethers";
// import { provider } from ".../../../constants/provider";

// async function getAaveRates(aaveLendingPoolAddress: string, tokenIn: string) {
//     // Create contract instances
//     const aaveLendingPool = new ethers.Contract(
//         aaveLendingPoolAddress,
//         aaveLendingPoolABI,
//         provider,
//     );

//     // Get the current rate for the token on Aave
//     const aaveReserveData = await aaveLendingPool.getReserveData(tokenIn);
//     const aaveRate = aaveReserveData.currentLiquidityRate;

//     // Get the current rate for the token on Balancer
//     // Note: This is a simplification. The actual rate would depend on the pool's weights and balances.
//     const balancerWeights = await balancerPool.getNormalizedWeights();
//     const balancerRate = balancerWeights[0];

//     return { aaveRate, balancerRate };
// }

// async function getBalancerRates() {
//Get balancer rates
// }
