import { getAmountsOut as getAmountsOutBN } from "./getAmountsIOBN";
import { BoolTrade, Quotes, Sizes } from "../../../../constants/interfaces";
import { BN2BigInt, fu, pu } from "../../../modules/convertBN";
import { getAmountsOut } from "./getAmountsIOJS";
import { walletTradeSize } from "../tools/walletTradeSizes";

export async function getQuotes(trade: BoolTrade): Promise<Quotes> {
    let quotes: Quotes = {
        target: {
            tokenInOut: trade.quotes.target.tokenInOut,
            tokenOutOut: trade.quotes.target.tokenOutOut,
            flashTokenInOut: trade.quotes.target.tokenInOut,
            flashTokenOutOut: trade.quotes.target.tokenOutOut,
        },
        loanPool: {
            tokenInOut: trade.quotes.loanPool.tokenInOut,
            tokenOutOut: trade.quotes.loanPool.tokenOutOut,
            flashTokenInOut: trade.quotes.loanPool.tokenInOut,
            flashTokenOutOut: trade.quotes.loanPool.tokenOutOut,
        },
    };

    let wallet = await walletTradeSize(trade);

    // ///YOU CAN'T PASS IN TRADESIZE TO GET AMOUTN OF tokenIn OUT

    // if (wallet.tokenIn <= 0 && wallet.tokenOut <= 0) {
    // }
    // if (trade.tradeSizes.loanPool.tokenIn.size <= 0) {
    // }

    // in single/non-flash trades, profit must be returned to tokenIn, so this calc is needed to work out trade .
    // const walletString = {
    //     tokenIn: fu(wallet.tokenIn, trade.tokenIn.data.decimals) + trade.tokenIn.data.symbol,
    //     tokenOut: fu(wallet.tokenOut, trade.tokenOut.data.decimals) + trade.tokenOut.data.symbol,
    // };
    // console.log("WalletBalances: ");
    // console.log(walletString);
    const walletQuotes = async () => {
        // If you only have WMATIC in your wallet (to simplify the bot) singleLoanPoolTokenInOut == 0.
        const singleLoanPooltokenOutOut = await getAmountsOut(
            trade.loanPool.router,
            wallet.tokenIn,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        const singleTargettokenOutOut = await getAmountsOut(
            trade.target.router,
            wallet.tokenIn,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        const singleLoanPooltokenInOut = await getAmountsOut(
            trade.loanPool.router,
            singleTargettokenOutOut, // Pass in tokenOut from target to compare profitability later
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );

        const singleTargettokenInOut = await getAmountsOut(
            trade.target.router,
            singleTargettokenOutOut, // Both tradeSizes should be the same for the amountsOut
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );

        return {
            singleLoanPooltokenInOut,
            singleLoanPooltokenOutOut,
            singleTargettokenInOut,
            singleTargettokenOutOut,
        };
    };

    const flashTargetQuotes = async () => {
        const flashTargettokenInOut = await getAmountsOut(
            trade.target.router,
            trade.tradeSizes.target.tradeSizeTokenOut.size,
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );

        // flashing tokenIn into tokenOut
        const flashTargettokenOutOut = await getAmountsOut(
            trade.target.router,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        return {
            flashTargettokenInOut,
            flashTargettokenOutOut,
        };
    };

    const flashLoanPoolQuotes = async () => {
        const flashLoanPooltokenInOut = await getAmountsOut(
            trade.loanPool.router,
            trade.tradeSizes.target.tradeSizeTokenOut.size,
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );
        // tradeSize = tokenOut from loanPool
        const flashLoanPooltokenOutOut = await getAmountsOut(
            trade.loanPool.router,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        // tradeSize = tokenOut from loanPool

        return {
            flashLoanPooltokenInOut,
            flashLoanPooltokenOutOut,
        };
    };

    quotes = {
        target: {
            tokenInOut: (await walletQuotes()).singleTargettokenInOut,
            tokenOutOut: (await walletQuotes()).singleTargettokenOutOut,
            flashTokenInOut: (await flashTargetQuotes()).flashTargettokenInOut,
            flashTokenOutOut: (await flashTargetQuotes())
                .flashTargettokenOutOut,
        },
        loanPool: {
            tokenInOut: (await walletQuotes()).singleLoanPooltokenInOut,
            tokenOutOut: (await walletQuotes()).singleLoanPooltokenOutOut,
            flashTokenInOut: (await flashLoanPoolQuotes())
                .flashLoanPooltokenInOut,
            flashTokenOutOut: (await flashLoanPoolQuotes())
                .flashLoanPooltokenOutOut,
        },
    };
    const qStrings = {
        target: {
            tokenInOut:
                fu(quotes.target.tokenInOut, trade.tokenIn.data.decimals) +
                trade.tokenIn.data.symbol,
            tokenOutOut:
                fu(quotes.target.tokenOutOut, trade.tokenOut.data.decimals) +
                trade.tokenOut.data.symbol,
            flashTokenInOut:
                fu(quotes.target.flashTokenInOut, trade.tokenIn.data.decimals) +
                trade.tokenIn.data.symbol,
            flashTokenOutOut:
                fu(
                    quotes.target.flashTokenOutOut,
                    trade.tokenOut.data.decimals,
                ) + trade.tokenOut.data.symbol,
        },
        loanPool: {
            tokenInOut:
                fu(quotes.loanPool.tokenInOut, trade.tokenIn.data.decimals) +
                trade.tokenIn.data.symbol,
            tokenOutOut:
                fu(quotes.loanPool.tokenOutOut, trade.tokenOut.data.decimals) +
                trade.tokenOut.data.symbol,
            flashTokenInOut:
                fu(
                    quotes.loanPool.flashTokenInOut,
                    trade.tokenIn.data.decimals,
                ) + trade.tokenIn.data.symbol,
            flashTokenOutOut:
                fu(
                    quotes.loanPool.flashTokenOutOut,
                    trade.tokenOut.data.decimals,
                ) + trade.tokenOut.data.symbol,
        },
    };

    // console.log("quotes: ", qStrings);
    return quotes;
}
