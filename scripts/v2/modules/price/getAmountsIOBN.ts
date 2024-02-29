import { BigNumber as BN } from "bignumber.js";
import { logger } from "../../../../constants/logger";
/**
 * bignumber.js handles decimals; ethers.js can't
 * @param amountIn
 * @param reserveIn
 * @param reserveOut
 * @returns Local calculation of amounts in/out in BN (bignnumber.js)
 */
// import { BN as BN } from "bignumber.js";

// function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns(uint amountOut) {
//         uint amountInWithFee = amountIn.multipliedBy(997);
//         uint numerator = amountInWithFee.multipliedBy(reserveOut);
//         uint denominator = reserveIn.multipliedBy(1000).add(amountInWithFee);
//     amountOut = numerator / denominator;
// }

export async function getAmountsOut(amountIn: BN, reserveIn: BN, reserveOut: BN): Promise<BN> {
    if (amountIn === undefined) {
        return BN(0);
    }
    if (amountIn === BN(0)) {
        return BN(0);
    }
    if (
        reserveIn === undefined ||
        reserveOut === undefined ||
        reserveIn === BN(0) ||
        reserveOut === BN(0)
    ) {
        return BN(0);
    }
    const amountInWithFee = amountIn.multipliedBy(BN(997));
    const numerator = amountInWithFee.multipliedBy(reserveOut);
    // logger.info("reserve in type: ", typeof reserveIn, reserveIn);
    const denominator = reserveIn.multipliedBy(BN(1000)).plus(amountInWithFee);
    const result = numerator.div(denominator);
    return result.abs();
}

// export async function getAmountsIn(amountOut: BN, reserveIn: BN, reserveOut: BN) {
//     const numerator = reserveIn.multipliedBy(amountOut);
//     const denominator = reserveOut.minus(amountOut).multipliedBy(BN(0.97));
//     //this used to be plus 1, but it was probably causing errors since it was a hack to deal with javascript bignumber rounding errors when using ethers.js
//     const result = numerator.div(denominator);
//     return result.abs();
// }

// export async function getAmountsIO(
//     amountIn: BN,
//     reserve0: string,
//     reserve1: string,
//     // B1: boolean,
//     // A1: boolean
// ): Promise<{ amountOut: BN, amountRepay: BN }> {
//     const amountOut = await getAmountsOut(amountIn, BN(reserve0), BN(reserve1))
//     const amountRepay = await getAmountsIn(amountIn, BN(reserve1), BN(reserve0))
//     return { amountOut, amountRepay }
// }

// export async function getAmountsOut(amountIn: BN, reserveIn: BN, reserveOut: BN) {
//     let amountInWithFee = amountIn.multipliedBy(BN(997));
//     let numerator = amountInWithFee.multipliedBy(reserveOut);
//     let denominator = reserveIn.multipliedBy(BN(1000)).add(amountInWithFee);
//     let amountOut = numerator.div(denominator);
//     return amountOut;
// }

// export async function getAmountsIn(amountOut: BN, reserveIn: BN, reserveOut: BN) {
//     const numerator = reserveIn.multipliedBy(amountOut).multipliedBy(BN(1000));
//     const denominator = reserveOut.sub(amountOut).multipliedBy(BN(997));
//     return (numerator.div(denominator)).add(BN(1));
// }

// export async function getAmountsIO(
//     amountIn: BN,
//     aReserve0: BN,
//     aReserve1: BN,
//     bReserve0: BN,
//     bReserve1: BN,
//     B1: boolean,
//     A1: boolean
// ): Promise<any> {
//     const amountOutA = await getAmountsOut(amountIn, (A1 || B1 ? aReserve0 : aReserve1), (A1 || B1 ? aReserve1 : aReserve0))
//     const amountOutB = await getAmountsOut(amountIn, (A1 || B1 ? bReserve0 : bReserve1), (A1 || B1 ? bReserve1 : bReserve0))
//     const amountInA = await getAmountsIn(amountIn, (A1 || B1 ? aReserve1 : aReserve0), (A1 || B1 ? aReserve0 : aReserve1))
//     const amountInB = await getAmountsIn(amountIn, (A1 || B1 ? bReserve1 : bReserve0), (A1 || B1 ? bReserve0 : bReserve1))
//     return { amountOutA, amountOutB, amountInA, amountInB }
// }

// export async function getAmountsInx(amountOut: BN, reserveIn: BN, reserveOut: BN) {
//     let numerator = reserveIn.multipliedBy(amountOut).multipliedBy(1000);
//     let denominator = reserveOut.sub(amountOut).multipliedBy(997);
//     let amountIn = (numerator.div(denominator)).add(1);
//     return amountIn;
// }
// function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns(uint amountIn) {

//         uint numerator = reserveIn.multipliedBy(amountOut).multipliedBy(1000);
//         uint denominator = reserveOut.sub(amountOut).multipliedBy(997);
//     amountIn = (numerator / denominator).add(1);
// }

//reference solidity code

// // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
// function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns(uint amountOut) {
//     require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
// //     require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
// //         uint amountInWithFee = amountIn.multipliedBy(997);
// //         uint numerator = amountInWithFee.multipliedBy(reserveOut);
// //         uint denominator = reserveIn.multipliedBy(1000).add(amountInWithFee);
// //     amountOut = numerator / denominator;
// // }

// export async function priceImpact(pool: Pool) {
//     // Get the reserves of token0 and token1 in the Uniswap pool
//     const pair = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, provider);
//     const [reserve0, reserve1] = await pair.getReserves();

//     // Calculate the expected price of the trade based on the new reserves
//     const newReserve0 = reserve0.add(pu(amountIn, token0dec));
//     const newReserve1 = reserve1.sub(pu(amountOutA, token1dec));
//     const expectedPrice = newReserve1.multipliedBy(pu('1', token0dec)).div(newReserve0);

//     // Calculate the actual price of the trade
//     const actualPrice = pu(amountOutA, token1dec).div(pu(amountIn, token0dec));

//     // Compare the expected and actual prices
//     if (actualPrice.gt(expectedPrice)) {
//         // The trade had a price impact, adjust the amount of token0 to provide
//         const newAmountIn = expectedPrice.multipliedBy(pu(amountOutA, token1dec)).div(pu('1', token0dec));
//     }
// }

//   prevloanPoolK: '62673683260336596096008278208874583699326121',
//   postloanPoolK: '62674364084126706723607396160732338810535424'
/*

6267436408412670672360739616073 - 62673683260336596096008278208874 = 680810227900110106276



10.0001086%
6 267 436 408 412 670 672 360 739 616 073 is 10.0001% of 62 673 683 260 336 596 096 008 278 208 874


*/
