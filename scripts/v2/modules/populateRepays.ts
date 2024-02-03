import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./amountConverter";
import { getAmountsIn, getAmountsOut } from "./getAmountsIOLocal";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";

export class PopulateRepays {
    trade: BoolTrade;
    calc: AmountConverter;
    repays: Repays;

    constructor(trade: BoolTrade, calc: AmountConverter) {
        this.trade = trade;
        this.calc = calc;
        this.repays = {
            direct: {
                direct: 0n,
                directInTokenOut: 0n,
            },
            multi: {
                simpleMulti: 0n,
                getAmountsOut: 0n,
                getAmountsIn: 0n,
            },
            repay: 0n,
        };
    }

    /*
	I have to send back only the amount of token1 needed to repay the amount of token0 I was loaned.
	Thus I need to calculate the exact amount of token1 that tradeSize in tokenOut represents on loanPool, 
	and subtract it from recipient.amountOut before sending it back
	*/
    // const postReserveIn = this.trade.loanPool.reserveIn.sub(this.trade.target.tradeSize); // I think this is only relevant for uniswap K calcs
    async getRepays(): Promise<Repays> {
        async function direct(
            calc: AmountConverter,
            trade: BoolTrade,
        ): Promise<{ direct: bigint; directInTokenOut: bigint }> {
            const repayDirect = await calc.addFee(trade.target.tradeSize);
            // const directRepayLoanPoolInTokenOut = await getAmountsOut(
            // 	this.trade.target.tradeSize,
            // 	this.trade.loanPool.reserveIn, //
            // 	this.trade.loanPool.reserveOut
            // );

            //get loanPool conversion of tradeSize in terms of tokenOut
            const repayDirectBN = BigInt2BN(repayDirect, trade.tokenIn.decimals);
            const directRepayLoanPoolInTokenOutBN = repayDirectBN.multipliedBy(BN(trade.loanPool.priceOut));
            const directRepayLoanPoolInTokenOut = BN2BigInt(directRepayLoanPoolInTokenOutBN, trade.tokenOut.decimals);
            // const directRepayLoanPoolInTokenOutWithFee = await this.calc.addFee(directRepayLoanPoolInTokenOut);

            // this.trade.target.tradeSize
            // 	.mul(this.trade.loanPool.reserveOut.div(this.trade.loanPool.reserveIn))// will never work with ethers.js BigInt because of rounding down.
            // const simple = await calc.addFee(tradeSizeInTermsOfTokenOutOnLoanPool)
            return { direct: repayDirect, directInTokenOut: directRepayLoanPoolInTokenOut };
        }

        async function multi(
            calc: AmountConverter,
            trade: BoolTrade,
        ): Promise<{ simpleMulti: bigint; getAmountsOut: bigint; getAmountsIn: bigint }> {
            const ts = BigInt2BN(trade.target.tradeSize, trade.tokenIn.decimals);
            const tradeSizeInTermsOfTokenOutOnLoanPool = ts.multipliedBy(BN(trade.loanPool.priceOut));

            const simpleBN = tradeSizeInTermsOfTokenOutOnLoanPool.multipliedBy(1.003); // 0.3% fee
            const simple = BN2BigInt(simpleBN, trade.tokenOut.decimals);

            const repayByGetAmountsOut = await getAmountsOut(
                // getAmountsOut is used here, but you can also use getAmountsIn, as they can achieve similar results by switching reserves.
                trade.target.tradeSize,
                trade.loanPool.reserveIn,
                trade.loanPool.reserveOut, // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
            );

            const repayByGetAmountsIn = await getAmountsIn(
                //Will output tokenIn.
                trade.target.tradeSize,
                trade.loanPool.reserveOut, // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
                trade.loanPool.reserveIn,
            );

            return { simpleMulti: simple, getAmountsOut: repayByGetAmountsOut, getAmountsIn: repayByGetAmountsIn };
        }

        const d = await direct(this.calc, this.trade);
        const m = await multi(this.calc, this.trade);

        const repays: Repays = {
            direct: { direct: d.direct, directInTokenOut: d.directInTokenOut },
            multi: {
                simpleMulti: m.simpleMulti,
                getAmountsOut: m.getAmountsOut,
                getAmountsIn: m.getAmountsIn,
            },
            //SET YOUR CHOICE HERE:
            //getAmountsOut is wrong and forces a trade, but it is okay for testing at least.
            //getAmountsIn is the recommended choice, but it does not yield trades often enough to test.
            repay: m.getAmountsIn,
        };
        return repays;
    }
}
