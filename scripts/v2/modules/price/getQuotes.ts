import { getAmountsOut as getAmountsOutBN } from "./getAmountsIOBN";
import { BoolTrade, Quotes, Size } from "../../../../constants/interfaces";
import { pu } from "../../../modules/convertBN";
import { getFunds } from "../tools/getFunds";
import { getAmountsOut } from "./getAmountsIOJS";

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

    let walletSize = async (): Promise<Size> => {
        let funds = await getFunds(trade);
        if (funds.sizeBN.gt(trade.target.tradeSize.sizeBN)) {
            funds = trade.target.tradeSize;
        }
        return funds;
    };

    let wallet = await walletSize();

    const singleOutTarget = await getAmountsOut(trade.target.router, wallet.size, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleOutLoanPool = await getAmountsOut(trade.loanPool.router, wallet.size, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const flashOutTarget = await getAmountsOut(trade.target.router, trade.target.tradeSize.size, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const flashOutLoanPool = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    ); // token0 max out

    const singleOutTargetBN = await getAmountsOutBN(
        wallet.sizeBN, // token1 in
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );

    const singleOutLoanPoolBN = await getAmountsOutBN(
        wallet.sizeBN, // token1 in
        trade.loanPool.reserveInBN,
        trade.loanPool.reserveOutBN,
    );

    const flashOutTargetBN = await getAmountsOutBN(
        trade.target.tradeSize.sizeBN, // token1 in
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );

    const flashOutLoanPoolBN = await getAmountsOutBN(
        trade.target.tradeSize.sizeBN, // token1 in
        trade.loanPool.reserveInBN,
        trade.loanPool.reserveOutBN,
    ); // token0 max out

    // const singleOutTarget = pu(
    //     singleOutTargetBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const singleOutLoanPool = pu(
    //     singleOutLoanPoolBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const flashOutTarget = pu(
    //     flashOutTargetBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const flashOutLoanPool = pu(
    //     flashOutLoanPoolBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    trade.quotes = {
        target: {
            out: singleOutTarget,
            outBN: singleOutTargetBN,
            flashOut: flashOutTarget,
            flashOutBN: flashOutTargetBN,
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
