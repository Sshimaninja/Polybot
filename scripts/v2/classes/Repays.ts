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
            flashSingle: { singleIn: 0n, singleOut: 0n },
            flashMulti: 0n,
        };
    }
    async getRepays(): Promise<Repays> {
        // getSingle() Will only be used if I for triangular arbitrage, which requries extra protocol integration.

        let singleRepayTokenIn = await this.calc.addFee(this.trade.target.tradeSize.size);
        const getSingle = async (): Promise<{ singleIn: bigint; singleOut: bigint }> => {
            const singleRepayTokenInBN = BigInt2BN(singleRepayTokenIn, this.trade.tokenIn.decimals);
            const repayinTokenOut = await getAmountsIn(
                singleRepayTokenInBN,
                this.trade.loanPool.reserveOutBN,
                this.trade.loanPool.reserveInBN,
            );
            let singleRepayTokenOut = pu(
                repayinTokenOut.toFixed(this.trade.tokenOut.decimals),
                this.trade.tokenOut.decimals,
            );
            const singleRepay = {
                singleIn: singleRepayTokenIn, // Only usable if you can find another trade/pool elsewhere that will give you the exact amount of tokenIn you need to repay. TODO: IMPLEMENT THIS (TRIANGULAR ARBITRAGE)
                singleOut: singleRepayTokenOut,
            };
            return singleRepay;
        };
        console.log(
            "tradeSizeBN: ",
            this.trade.target.tradeSize.sizeBN.toString(),
            "tradeSizeJS: ",
            this.trade.target.tradeSize.size,
        );

        const loanFee = this.trade.target.tradeSize.sizeBN.multipliedBy(0.003);
        const loanPlusFee = this.trade.target.tradeSize.sizeBN.plus(loanFee);

        const getMultiFlash = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await getAmountsIn(
                loanPlusFee,
                this.trade.loanPool.reserveOutBN,
                this.trade.loanPool.reserveInBN,
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
            flashSingle: { singleIn: flashSingle.singleIn, singleOut: flashSingle.singleOut },
            flashMulti: flashMulti,
        };
        return repays;
    }
}
