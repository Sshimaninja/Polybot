import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./amountConverter";
import { getAmountsIn, getAmountsOut } from "./getAmountsIOJS";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";

export class PopulateRepays {
    trade: BoolTrade;
    calc: AmountConverter;
    repays: Repays;

    constructor(trade: BoolTrade, calc: AmountConverter) {
        this.trade = trade;
        this.calc = calc;
        this.repays = {
            direct: { directIn: 0n, directOut: 0n },
            multi: 0n,
            repay: 0n,
        };
    }
    async getRepays(): Promise<Repays> {
        const directRepayTokenIn = await this.calc.addFee(this.trade.target.tradeSize);
        const getDirect = async (): Promise<{ directIn: bigint; directOut: bigint }> => {
            const repayinTokenOut = await this.trade.loanPool.router.getAmountsIn(
                this.trade.loanPool.router,
                this.trade.target.tradeSize,
                [this.trade.tokenOut.id, this.trade.tokenIn.id],
            );
            const directRepay = {
                directIn: directRepayTokenIn, // Only usable if you can find another trade/pool elsewhere that will give you the exact amount of tokenIn you need to repay. TODO: IMPLEMENT THIS (TRIANGULAR ARBITRAGE)
                directOut: repayinTokenOut[0],
            };
            return directRepay;
        };

        const getMulti = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await this.trade.loanPool.router.getAmountsIn(
                //Will output tokenIn.
                this.trade.loanPool.router,
                this.trade.target.tradeSize,
                [this.trade.tokenOut.id, this.trade.tokenIn.id], // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
            );
            console.log("repayByGetAmountsIn: " + repayByGetAmountsIn);
            return repayByGetAmountsIn[0];
        };
        const direct = await getDirect();
        const multi = await getMulti();

        const repays: Repays = {
            direct: direct,
            multi: multi,
            //SET YOUR CHOICE HERE:
            repay: multi,
        };
        return repays;
    }
}
