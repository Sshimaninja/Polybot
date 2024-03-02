import { getAmountsOut as getAmountsOutBN } from "./getAmountsIOBN";
import { BoolTrade, Quotes, Size } from "../../../../constants/interfaces";
import { BN2BigInt, fu, pu } from "../../../modules/convertBN";
import { getAmountsOut } from "./getAmountsIOJS";
import { BigNumber as BN } from "bignumber.js";
import { tradeToPrice } from "../tradeMath";
import { slip } from "../../../../constants/environment";

export async function getQuotes(trade: BoolTrade): Promise<BoolTrade> {
    const quotes: Quotes = {
        target: {
            out: trade.quotes.target.out,
            in: trade.quotes.target.in,
            // outBN: trade.quotes.target.outBN,
            flashOut: trade.quotes.target.flashOut,
            // flashIn: trade.quotes.target.flashIn,
            // flashOutBN: trade.quotes.target.flashOutBN,
        },
        loanPool: {
            out: trade.quotes.loanPool.out,
            in: trade.quotes.loanPool.in,
            // outBN: trade.quotes.loanPool.outBN,
            flashOut: trade.quotes.loanPool.flashOut,
            // flashIn: trade.quotes.loanPool.flashIn,
            // flashOutBN: trade.quotes.loanPool.flashOutBN,
        },
    };

    interface WalletTradeSizes {
        tokenIn: bigint;
        tokenOut: bigint;
    }
    let walletTradeSize = async (): Promise<WalletTradeSizes> => {
        let size: WalletTradeSizes = {
            tokenIn: trade.target.tradeSize.size,
            tokenOut: trade.wallet.tokenOutBalance,
        };
        let funds = trade.wallet.tokenInBalance;

        if (funds > trade.target.tradeSize.size) {
            size.tokenIn = trade.target.tradeSize.size;
        }
        let tradeSizeTokenOutBN = await tradeToPrice(
            trade.loanPool.reserveOutBN,
            trade.loanPool.reserveInBN,
            BN(trade.target.priceIn),
            slip,
        );
        let tradeSizeTokenOut = BN2BigInt(tradeSizeTokenOutBN, trade.tokenOut.decimals);
        size = {
            tokenIn: size.tokenIn,
            tokenOut: tradeSizeTokenOut,
        };
        return size;
    };

    let wallet = await walletTradeSize();

    ///YOU CAN'T PASS IN TRADESIZE TO GET AMOUTN OF TOKENIN OUT

    if (wallet.tokenIn <= 0 && wallet.tokenOut <= 0) {
        return trade;
    }
    if (trade.target.tradeSize.size <= 0) {
        return trade;
    }

    const singleTargetTokenOut = await getAmountsOut(trade.target.router, wallet.tokenIn, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleLoanPoolTokenOut = await getAmountsOut(trade.loanPool.router, wallet.tokenIn, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleTargetTokenIn = await getAmountsOut(trade.target.router, wallet.tokenOut, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const singleLoanPoolTokenIn = await getAmountsOut(trade.loanPool.router, wallet.tokenOut, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const flashTargetTokenOut = await getAmountsOut(
        trade.target.router,
        trade.target.tradeSize.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    const flashLoanPoolTokenOut = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    // const flashOutTargetTokenIn = await getAmountsOut(
    //     trade.target.router,
    //     trade.target.tradeSize.size,
    //     [trade.tokenOut.id, trade.tokenIn.id],
    // );

    // const flashOutLoanPoolTokenIn = await getAmountsOut(
    //     trade.loanPool.router,
    //     trade.target.tradeSize.size,
    //     [trade.tokenOut.id, trade.tokenIn.id],
    // );

    trade.quotes = {
        target: {
            out: singleTargetTokenOut,
            in: singleTargetTokenIn,
            // flashIn: flashOutTargetTokenIn,
            flashOut: flashTargetTokenOut,
        },
        loanPool: {
            out: singleLoanPoolTokenOut,
            in: singleLoanPoolTokenIn,
            // flashIn: flashOutLoanPoolTokenIn,
            flashOut: flashLoanPoolTokenOut,
        },
    };

    return trade;
}
