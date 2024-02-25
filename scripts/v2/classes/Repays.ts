import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./AmountConverter";
import { getAmountsIn, getAmountsOut } from "../modules/getAmounts/getAmountsIOJS";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";

export class PopulateRepays {
    trade: BoolTrade;
    calc: AmountConverter;
    repays: Repays;

    constructor(trade: BoolTrade, calc: AmountConverter) {
        this.trade = trade;
        this.calc = calc;
        this.repays = {
            single: { singleIn: 0n, singleOut: 0n },
            multi: 0n,
            repay: 0n,
        };
    }
    async getRepays(): Promise<Repays> {
        const singleRepayTokenIn = await this.calc.addFee(this.trade.target.tradeSize);
        const getSingle = async (): Promise<{ singleIn: bigint; singleOut: bigint }> => {
            const repayinTokenOut = await this.trade.loanPool.router.getAmountsIn(
                singleRepayTokenIn, //reflects trade on another pool which adds 0.3% to the trade
                [this.trade.tokenOut.id, this.trade.tokenIn.id],
            );
            const singleRepay = {
                singleIn: singleRepayTokenIn, // Only usable if you can find another trade/pool elsewhere that will give you the exact amount of tokenIn you need to repay. TODO: IMPLEMENT THIS (TRIANGULAR ARBITRAGE)
                singleOut: repayinTokenOut[0],
            };
            return singleRepay;
        };

        const getMulti = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await this.trade.loanPool.router.getAmountsIn(
                this.trade.target.tradeSize,
                [this.trade.tokenOut.id, this.trade.tokenIn.id], // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
            );
            // console.log("repayByGetAmountsIn: " + repayByGetAmountsIn);// DEBUG
            return repayByGetAmountsIn[0];
        };
        const single = await getSingle();
        const multi = await getMulti();

        const repays: Repays = {
            single: single,
            multi: multi,
            //SET YOUR CHOICE HERE:
            repay: multi,
        };
        return repays;
    }
}
