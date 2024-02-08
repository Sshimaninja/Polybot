import { getAmountsOut } from "./getAmountsIOLocal";

export async function getProfitInTokenOut(
    reserveIn: bigint,
    reserveOut: bigint,
    tradeSize: bigint,
    amountOut: bigint,
    amountRepay: bigint,
): Promise<[BigInt, BigInt]> {
    const amountsMulti = await getAmountsOut(
        amountOut - amountRepay, // token1 in
        reserveOut, // token1 out
        reserveIn, // token0 in
    );
    const amountsSingle = await getAmountsOut(
        amountRepay - amountOut, // token0 in
        reserveIn, // token0 out
        reserveOut, // token1 in
    );
    const profitMulti = amountsMulti - tradeSize; // token1 out - token1 in
    const profitSingle = amountsSingle - tradeSize; // token1 out - token1 in
    return [profitMulti, profitSingle];
}
