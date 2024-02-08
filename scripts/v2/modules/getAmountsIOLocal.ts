/**
 * Local calculation of amounts in/out
 * @param amountIn
 * @param reserveIn
 * @param reserveOut
 * @returns amountOut from amountIn
 */
export async function getAmountsOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): Promise<bigint> {
  // amountIn * 997
  const amountInWithFee = amountIn * 997n;
  // (amountInwithFee) * reserveOut
  const numerator = amountInWithFee * reserveOut;
  // (reserveIn * 1000) + (amountInwithFee)
  const denominator = reserveIn * 1000n + amountInWithFee;
  // (amountInwithFee * reserveOut) / (reserveIn + amountInwithFee)
  const amountOut = numerator / denominator;
  return amountOut;
}
/**
 * Local calculation of amounts in/out
 * @param amountIn
 * @param reserveIn
 * @param reserveOut
 * @returns the minimum 'input asset' amount required to buy the given output asset amount (accounting for fees) given reserves.
 */
//amountIn = amountOut * reserveIn / reserveOut - amountOut
//
export async function getAmountsIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): Promise<bigint> {
  // reserveIn * amountOut
  const numerator = amountOut * reserveIn * 1000n;
  const denominator = reserveOut * 997n + amountOut * 1000n;
  return numerator / denominator;
}

export async function getAmountsInJS(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): Promise<bigint> {
  // reserveIn * amountOut
  const numerator = amountOut * reserveIn * 1000n;
  const denominator = reserveOut * 997n + amountOut * 1000n;
  return numerator / denominator;
}

//from https://github.com/Uniswap/v2-periphery/blob/master/contracts/libraries/UniswapV2Library.sol

// given an output amount of an asset and pair reserves, returns a required input amount of the other asset
// function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns(uint amountIn) {
// 	require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
// 	require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
//  uint numerator = reserveIn  * (amountOut)  * (1000);
// 	uint denominator = reserveOut.sub(amountOut)  * (997);
// 	amountIn = (numerator / denominator) + (1);
// }
