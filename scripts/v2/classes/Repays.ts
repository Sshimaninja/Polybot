import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./AmountConverter";
import { tradeLogs } from "../modules/tradeLog";
import { getAmountsIn, getAmountsOut } from "../modules/price/getAmountsIOJS";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";
import { logger } from "../../../constants/logger";

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
        let r: Repays = {
            single: 0n,
            flashSingle: 0n,
            flashMulti: 0n,
        };
        if (this.trade.target.tradeSize.token0.size <= 0) {
            return r;
        }

        // getSingle() Will only be used if I for triangular arbitrage, which requries extra protocol integration.
        let loanPlusFee = await this.calc.addFee(this.trade.target.tradeSize.token0.size);

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
            // const repayInTokenOut = await getAmountsOut(
            //     tradeSizeWithFee, //tradeSize in tokenIn
            //     this.trade.loanPool.reserveInBN,
            //     this.trade.loanPool.reserveOutBN,
            // );
            // let singleRepayTokenOut = pu(
            //     repayInTokenOut.toFixed(this.trade.tokenOut.decimals),
            //     this.trade.tokenOut.decimals,
            // );

            const repayInTokenOut = await getAmountsIn(
                this.trade.loanPool.router,
                loanPlusFee, //tradeSize in tokenIn
                [this.trade.tokenOut.id, this.trade.tokenIn.id],
            );
            // console.log(">>>>>>>>>>>> FLASHSINGLE REPAY:", repayInTokenOut);
            // const singleRepay = {
            //     singleIn: singleRepayTokenOut, // Only usable if you can find another trade/pool elsewhere that will give you the exact amount of tokenIn you need to repay. TODO: IMPLEMENT THIS (TRIANGULAR ARBITRAGE)
            //     singleOut: singleRepayTokenOut,
            // };
            // const bigintSizeWithFee = BN2BigInt(tradeSizeWithFee, this.trade.tokenIn.decimals);
            return repayInTokenOut; //falsely inflated to force multi trade (this isn't a real trade, just a placeholder for now)
        };

        const logs = await tradeLogs(this.trade);
        // logger.info(
        //     "::::::::::::::::::::::::DEBUGGING TRADELOGS IN REPAYS::::::::::::::::::::::::",
        // );
        // logger.info(logs);
        // console.log("LOANPLUSFEE:::::::::::::::: ", loanPlusFee); //debug
        const getMultiFlash = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await getAmountsIn(
                this.trade.loanPool.router,
                loanPlusFee, //tradeSize in tokenIn
                [this.trade.tokenOut.id, this.trade.tokenIn.id],
            );
            // console.log(">>>>>>>>>>>> FLASHMULTI REPAY:", repayByGetAmountsIn);
            return repayByGetAmountsIn;
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
