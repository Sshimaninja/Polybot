import { getAmountsOut as getAmountsOutBN } from "./getAmountsIOBN";
import { BoolTrade, Quotes, Size } from "../../../../constants/interfaces";
import { pu } from "../../../modules/convertBN";
import { getFunds } from "../tools/getFunds";
import { getAmountsOut } from "./getAmountsIOJS";

export async function getQuotes(trade: BoolTrade): Promise<BoolTrade> {
    const quotes: Quotes = {
        target: {
            out: trade.quotes.target.out,
            in: trade.quotes.target.in,
            // outBN: trade.quotes.target.outBN,
            flashOut: trade.quotes.target.flashOut,
            flashIn: trade.quotes.target.flashIn,
            // flashOutBN: trade.quotes.target.flashOutBN,
        },
        loanPool: {
            out: trade.quotes.loanPool.out,
            in: trade.quotes.loanPool.in,
            // outBN: trade.quotes.loanPool.outBN,
            flashOut: trade.quotes.loanPool.flashOut,
            flashIn: trade.quotes.loanPool.flashIn,
            // flashOutBN: trade.quotes.loanPool.flashOutBN,
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

    if (wallet.size <= 0) {
        return trade;
    }
    if (trade.target.tradeSize.size <= 0) {
        return trade;
    }
    const singleOutTargetTokenOut = await getAmountsOut(trade.target.router, wallet.size, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleOutLoanPoolTokenOut = await getAmountsOut(trade.loanPool.router, wallet.size, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const flashOutTargetTokenOut = await getAmountsOut(
        trade.target.router,
        trade.target.tradeSize.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    const flashOutLoanPoolTokenOut = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    const singleOutTargetTokenIn = await getAmountsOut(trade.target.router, wallet.size, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const singleOutLoanPoolTokenIn = await getAmountsOut(trade.loanPool.router, wallet.size, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const flashOutTargetTokenIn = await getAmountsOut(
        trade.target.router,
        trade.target.tradeSize.size,
        [trade.tokenOut.id, trade.tokenIn.id],
    );

    const flashOutLoanPoolTokenIn = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.size,
        [trade.tokenOut.id, trade.tokenIn.id],
    );

    // const singleOutTargetTokenOutBN = await getAmountsOutBN(
    //     wallet.sizeBN, // token1 in
    //     trade.target.reserveInBN,
    //     trade.target.reserveOutBN,
    // );

    // const singleOutLoanPoolTokenOutBN = await getAmountsOutBN(
    //     wallet.sizeBN, // token1 in
    //     trade.loanPool.reserveInBN,
    //     trade.loanPool.reserveOutBN,
    // );

    // const flashOutTargetTokenOutBN = await getAmountsOutBN(
    //     trade.target.tradeSize.sizeBN, // token1 in
    //     trade.target.reserveInBN,
    //     trade.target.reserveOutBN,
    // );

    // const flashOutLoanPoolTokenOutBN = await getAmountsOutBN(
    //     trade.target.tradeSize.sizeBN, // token1 in
    //     trade.loanPool.reserveInBN,
    //     trade.loanPool.reserveOutBN,
    // ); // token0 max out

    // const singleOutTargetTokenOut = pu(
    //     singleOutTargetTokenOutBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const singleOutLoanPoolTokenOut = pu(
    //     singleOutLoanPoolTokenOutBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const flashOutTargetTokenOut = pu(
    //     flashOutTargetTokenOutBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    // const flashOutLoanPoolTokenOut = pu(
    //     flashOutLoanPoolTokenOutBN.toFixed(trade.tokenOut.decimals),
    //     trade.tokenOut.decimals,
    // );

    trade.quotes = {
        target: {
            out: singleOutTargetTokenOut,
            in: singleOutTargetTokenIn,
            flashIn: flashOutTargetTokenIn,
            flashOut: flashOutTargetTokenOut,
        },
        loanPool: {
            out: singleOutLoanPoolTokenOut,
            in: singleOutLoanPoolTokenIn,
            flashIn: flashOutLoanPoolTokenIn,
            flashOut: flashOutLoanPoolTokenOut,
        },
    };

    return trade;
}
// // SUBTRACT SLIPPAGE FROM EXPECTED AMOUNTOUT. This is an attempt to offset 'INSUFFICIENT_OUTPUT_AMOUNT' errors.
// trade.quotes.target.flashOut = await this.calc0.subSlippage(
//     trade.quotes.target.flashOut,
//     trade.tokenOut.decimals,
// );
