import { BigNumber as BN } from "bignumber.js";
/**
 *
 * @param reserveIn
 * @param reserveOut
 * @param targetPrice
 * @param slippageTolerance
 * @returns maximum trade size for a given pair, taking into account slippage
 */

/*

*/
export async function getMaxTokenIn(reserveIn: BN, slippageTolerance: BN): Promise<BN> {
    const maxTokenIn = reserveIn.multipliedBy(BN(1).plus(slippageTolerance)).minus(reserveIn);
    //1000 * 1.002 = 1002 - 1000 = 2
    return maxTokenIn;
}

/*
- getMaxToken1Out:
- ex: this pool's reserveIn/reserveOut: 1000 / 1580000 = 1/1580
- currentPrice = 1580
- slippage = 0.002 = 0.2%
- slippageNum = currentPrice * slippage = 1580 * 0.002 = 3.16
- lowestPrice = currentPrice - slippageNum = 1580 - 3.16 = 1576.84
- targetReserves = reserveIn * lowestPrice = 1000 * 1576.84 = 1576840
- maxToken1Out = reserveOut - targetReserves = 1580000 - 1576840 = 3160
*/

export async function getMaxTokenOut(reserveOut: BN, slippageTolerance: BN): Promise<BN> {
    const maxTokenOut = reserveOut.multipliedBy(BN(1).minus(slippageTolerance)).minus(reserveOut);
    return maxTokenOut;
}

/*
- tradeToPrice Equation: 
- ex: this pool's reserveIn/reserveOut: 1000 / 1580000 = 1/1580
- targetPrice = 1 / 1659 (must be higher than currentPrice)
- currentPrice = 1 / 1580
- difference = 1659 - 1580 = 79
- liquidity needed = difference * reserveIn = tradeSize = 79 * 1000 = 79000
- checkMath = 1580000 + 79000 = 1659000
 */
/**
 *
 * @param reserveIn target
 * @param reserveOut target
 * @param loanPoolPrice == loanPool (lower price)
 * @param slippageTolerance
 * @returns
 */

export async function tradeToPrice(
    reserveIn: BN,
    reserveOut: BN,
    loanPoolPrice: BN,
    slippageTolerance: BN,
): Promise<BN> {
    //targetPrice 0.520670400977951207 + 0.519935327393096545 = 1.040605728371047752 / 2 = 0.520302864185523876
    const currentPrice = reserveOut.div(reserveIn); // 64133 / 123348 = 0.51993546713363816194830884975841
    const diff = loanPoolPrice.minus(currentPrice); // 0.520302864185523876 - 0.51993546713363816194830884975841 = 0.00036739705188571405169115024159
    if (loanPoolPrice.gt(currentPrice)) {
        console.log(
            "[tradeToPrice]: loanPoolPrice must be lower than currentPrice or else tradeSize will be negative (trade should remove liquidity from target)",
        );
        console.log(
            "[tradeToPrice]: currentPrice: ",
            currentPrice.toFixed(6),
            "targetPrice: ",
            loanPoolPrice.toFixed(6),
        );
    }
    // Calculate the maximum trade size that would result in a slippage equal to slippageTolerance
    let tradeSize = diff.multipliedBy(reserveIn); // 0.00036739705188571405169115024159 * 123348 = 45.285714285714285714285714285714
    const maxTradeSize = await getMaxTokenIn(reserveOut, slippageTolerance); // 123348 * 0.002 = 246.696
    if (tradeSize.lt(maxTradeSize)) {
        return tradeSize; // 45.285714285714285714285714285714
    } else {
        return maxTradeSize; // 246.696
    }
}

export async function calculateMostProfitableTrade(
    targetPoolPrice: BN,
    loanPoolPrice: BN,
    targetReserveIn: BN,
    loanPoolReserveOut: BN,
    slippageTolerance: BN,
    transactionFee: BN,
): Promise<BN> {
    // Calculate the current prices in both pools
    // const targetPoolPrice = targetReserveOut.div(targetReserveIn);
    // const loanPoolPrice = loanPoolReserveOut.div(loanPoolReserveIn);

    // Calculate the price difference
    const priceDifference = targetPoolPrice.minus(loanPoolPrice);

    // Calculate the maximum trade size in the target pool
    const maxTradeSizeTarget = await getMaxTokenIn(targetReserveIn, slippageTolerance);

    // Calculate the maximum trade size in the loan pool
    const maxTradeSizeLoan = await getMaxTokenOut(loanPoolReserveOut, slippageTolerance);

    // Calculate the potential profit for each trade size
    const profitTarget = maxTradeSizeTarget.multipliedBy(priceDifference).minus(transactionFee);
    const profitLoan = maxTradeSizeLoan.multipliedBy(priceDifference).minus(transactionFee);

    // Choose the trade size that gives the highest profit
    if (profitTarget.gt(profitLoan)) {
        return maxTradeSizeTarget;
    } else {
        return maxTradeSizeLoan;
    }
}
