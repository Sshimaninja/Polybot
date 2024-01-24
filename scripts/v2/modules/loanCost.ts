import { BigNumber as BN } from 'bignumber.js'
/**
 * Calcs the cost of loan in real & percentage terms.
 * @param amountOutLoanPool 
 * @param amountRepayLoanPool 
 * @returns {loanCost, loanCostPercentage}.
 */
export async function calculateLoanCost(
    amountOutLoanPool: BN,
    amountRepayLoanPool: BN
): Promise<{ loanCost: BN, loanCostPercentage: BN }> {
    let loanCost = amountOutLoanPool.minus(amountRepayLoanPool)
    let loanCostPercentage = loanCost.dividedBy(amountOutLoanPool).multipliedBy(100)
    return { loanCost, loanCostPercentage }
}
