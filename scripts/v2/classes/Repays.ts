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
        if (this.trade.tradeSizes.loanPool.tradeSizeToken0.size <= 0) {
            return r;
        }

        // getSingle() Will only be used if I for triangular arbitrage, which requries extra protocol integration.
        let loanPlusFee = await this.calc.addFee(
            this.trade.tradeSizes.loanPool.tradeSizeToken0.size,
        );

        const getSingle = async (): Promise<bigint> => {
            const repayInTokenOut = await getAmountsIn(this.trade.loanPool.router, loanPlusFee, [
                this.trade.tokenOut.data.id,
                this.trade.tokenIn.data.id,
            ]);
            return repayInTokenOut; //falsely inflated to force multi trade (this isn't a real trade, just a placeholder for now)
        };

        const logs = await tradeLogs(this.trade);
        const getMultiFlash = async (): Promise<bigint> => {
            const repayByGetAmountsIn = await getAmountsIn(
                this.trade.loanPool.router,
                this.trade.tradeSizes.loanPool.tradeSizeToken0.size, //tradeSize in tokenIn
                [this.trade.tokenOut.data.id, this.trade.tokenIn.data.id],
            );
            return repayByGetAmountsIn;
        };
        const flashMulti = await getMultiFlash();
        const flashSingle = await getSingle();
        const repays: Repays = {
            single: 0n,
            flashSingle: flashSingle,
            flashMulti: flashMulti,
        };
        return repays;
    }
}
