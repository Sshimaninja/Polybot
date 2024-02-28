import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./AmountConverter";
import { getAmountsIn, getAmountsOut } from "../modules/price/getAmountsIOBN";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";

export class PopulateRepays {
    trade: BoolTrade;
    calc: AmountConverter;
    repays: Repays;

    constructor(trade: BoolTrade, calc: AmountConverter) {
        this.trade = trade;
        this.calc = calc;
        this.repays = {
            single: 0n,
            flashSingle: 0n,
            flashMulti: 0n,
        };
    }
    async getRepays(): Promise<Repays> {
        // getSingle() Will only be used if I for triangular arbitrage, which requries extra protocol integration.

        const tradeSizeWithFee = this.trade.target.tradeSize.sizeBN.multipliedBy(1.003);

        // const getCoverAmount = async (
        //     tokenInAmount: BN,
        //     reserveIn: BN,
        //     reserveOut: BN,
        // ): Promise<BN> => {
        //     // Calculate the price of tokenIn in terms of tokenOut
        //     const priceInTermsOfOut = reserveOut.div(reserveIn);

        //     // Calculate the amount of tokenOut needed to cover the loan
        //     const coverAmount = tokenInAmount.multipliedBy(priceInTermsOfOut);

        //     return coverAmount;
        // };

        const getSingle = async (): Promise<bigint> => {
            const repayinTokenOut = await getAmountsOut(
                tradeSizeWithFee, //tradeSize in tokenIn
                this.trade.loanPool.reserveInBN,
                this.trade.loanPool.reserveOutBN,
            );
            let singleRepayTokenOut = pu(
                repayinTokenOut.toFixed(this.trade.tokenOut.decimals),
                this.trade.tokenOut.decimals,
            );

            // const singleRepay = {
            //     singleIn: singleRepayTokenOut, // Only usable if you can find another trade/pool elsewhere that will give you the exact amount of tokenIn you need to repay. TODO: IMPLEMENT THIS (TRIANGULAR ARBITRAGE)
            //     singleOut: singleRepayTokenOut,
            // };
            const bigintSizeWithFee = BN2BigInt(tradeSizeWithFee, this.trade.tokenIn.decimals);
            return singleRepayTokenOut * 2n; //falsely inflated to force multi trade (this isn't a real trade, just a placeholder for now)
        };

        const loanFee = this.trade.target.tradeSize.sizeBN.multipliedBy(0.003);
        const loanPlusFee = this.trade.target.tradeSize.sizeBN.plus(loanFee);

        const getMultiFlash = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await getAmountsOut(
                loanPlusFee, //tradeSize in tokenIn
                this.trade.loanPool.reserveInBN,
                this.trade.loanPool.reserveOutBN,
            );

            const multi = pu(
                repayByGetAmountsIn.toFixed(this.trade.tokenOut.decimals),
                this.trade.tokenOut.decimals,
            );
            return multi;
        };
        const flashMulti = await getMultiFlash();
        const flashSingle = await getSingle();
        const repays: Repays = {
            single: 0n,
            flashSingle: flashSingle,
            flashMulti: flashMulti,
        };
        // console.log(">>>>>>>>>>>>", repays);
        return repays;
    }
}
