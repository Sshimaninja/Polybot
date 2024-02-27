import { getAmountsOut } from "./getAmountsIOBN";
import { BoolTrade, Quotes } from "../../../../constants/interfaces";
import { pu } from "../../../modules/convertBN";
import { getFunds } from "../tools/getFunds";

// interface Quotes {
//     target: {
//         out: bigint;
//         flashOut: string;
//     };
//     loanPool: {
//         out: bigint;
//         flashOut: string;
//     };
// }
export async function getQuotes(trade: BoolTrade): Promise<BoolTrade> {
    const quotes: Quotes = {
        target: {
            out: trade.quotes.target.out,
            outBN: trade.quotes.target.outBN,
            flashOut: trade.quotes.target.flashOut,
            flashOutBN: trade.quotes.target.flashOutBN,
        },
        loanPool: {
            out: trade.quotes.loanPool.out,
            outBN: trade.quotes.loanPool.outBN,
            flashOut: trade.quotes.loanPool.flashOut,
            flashOutBN: trade.quotes.loanPool.flashOutBN,
        },
    };

    const walletSize = await getFunds(trade);

    const singleOutTargetBN = await getAmountsOut(
        walletSize.sizeBN, // token1 in
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );

    const singleOutLoanPoolBN = await getAmountsOut(
        walletSize.sizeBN, // token1 in
        trade.loanPool.reserveInBN,
        trade.loanPool.reserveOutBN,
    );

    const flashOutTargetBN = await getAmountsOut(
        trade.target.tradeSize.sizeBN, // token1 in
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );

    const flashOutLoanPoolBN = await getAmountsOut(
        trade.target.tradeSize.sizeBN, // token1 in
        trade.loanPool.reserveInBN,
        trade.loanPool.reserveOutBN,
    ); // token0 max out

    const singleOutTarget = pu(
        singleOutTargetBN.toFixed(trade.tokenOut.decimals),
        trade.tokenOut.decimals,
    );

    const singleOutLoanPool = pu(
        singleOutLoanPoolBN.toFixed(trade.tokenOut.decimals),
        trade.tokenOut.decimals,
    );

    const flashOutTarget = pu(
        flashOutTargetBN.toFixed(trade.tokenOut.decimals),
        trade.tokenOut.decimals,
    );

    const flashOutLoanPool = pu(
        flashOutLoanPoolBN.toFixed(trade.tokenOut.decimals),
        trade.tokenOut.decimals,
    );

    trade.quotes = {
        target: {
            out: singleOutTarget,
            outBN: singleOutTargetBN,
            flashOut: singleOutTarget,
            flashOutBN: singleOutTargetBN,
        },
        loanPool: {
            out: singleOutLoanPool,
            outBN: singleOutLoanPoolBN,
            flashOut: flashOutLoanPool,
            flashOutBN: flashOutLoanPoolBN,
        },
    };

    return trade;
}
// // SUBTRACT SLIPPAGE FROM EXPECTED AMOUNTOUT. This is an attempt to offset 'INSUFFICIENT_OUTPUT_AMOUNT' errors.
// trade.quotes.target.flashOut = await this.calc0.subSlippage(
//     trade.quotes.target.flashOut,
//     trade.tokenOut.decimals,
// );
