// import { BigInt as BigInt } from 'bignumber.js';
interface Impact {
    priceImpact: bigint;
    newPrice: bigint;
}
// get priceImpact for each.
export async function getImpact(
    reservesIn: bigint,
    reservesOut: bigint,
    amountIn: bigint,
    amountOut: bigint,
): Promise<Impact> {
    const reserveIn = reservesIn;
    const reserveOut = reservesOut;

    // Calculate the new reserves after the trade
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveOut + amountOut;

    // Calculate the new price of the tokenIn (reserve0)
    const newPrice = newReserveOut / newReserveIn;

    // Calculate the price impact of the trade
    const marketPrice = reserveOut / reserveIn;
    const priceImpact = marketPrice - (newPrice / marketPrice) * BigInt(100);

    const impact = { priceImpact, newPrice };

    return impact;
}
