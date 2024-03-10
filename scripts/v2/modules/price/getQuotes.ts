import { getAmountsOut as getAmountsOutBN } from "./getAmountsIOBN";
import { BoolTrade, Quotes, Sizes } from "../../../../constants/interfaces";
import { BN2BigInt, fu, pu } from "../../../modules/convertBN";
import { getAmountsOut } from "./getAmountsIOJS";
import { BigNumber as BN } from "bignumber.js";
import { tradeToPrice } from "../tradeMath";
import { slip } from "../../../../constants/environment";
import { walletTradeSize } from "../tools/walletTradeSizes";

export async function getQuotes(trade: BoolTrade): Promise<Quotes> {
    let quotes: Quotes = {
        target: {
            token0Out: trade.quotes.target.token0Out,
            token1Out: trade.quotes.target.token1Out,
            flashToken0Out: trade.quotes.target.token0Out,
            flashToken1Out: trade.quotes.target.token1Out,
        },
        loanPool: {
            token1Out: trade.quotes.loanPool.token1Out,
            token0Out: trade.quotes.loanPool.token0Out,
            flashToken0Out: trade.quotes.loanPool.token0Out,
            flashToken1Out: trade.quotes.loanPool.token1Out,
        },
    };

    let wallet = await walletTradeSize(trade);

    // ///YOU CAN'T PASS IN TRADESIZE TO GET AMOUTN OF token0 OUT

    // if (wallet.token0 <= 0 && wallet.token1 <= 0) {
    // }
    // if (trade.tradeSizes.loanPool.token0.size <= 0) {
    // }

    // in single/non-flash trades, profit must be returned to tokenIn, so this calc is needed to work out trade .
    const walletQuotes = async () => {
        const singleTargetToken1Out = await getAmountsOut(trade.target.router, wallet.token0, [
            trade.tokenIn.data.id,
            trade.tokenOut.data.id,
        ]);

        const singleLoanPoolToken1Out = await getAmountsOut(trade.loanPool.router, wallet.token0, [
            trade.tokenIn.data.id,
            trade.tokenOut.data.id,
        ]);

        const singleTargetToken0Out = await getAmountsOut(trade.target.router, wallet.token1, [
            trade.tokenOut.data.id,
            trade.tokenIn.data.id,
        ]);

        const singleLoanPoolToken0Out = await getAmountsOut(trade.loanPool.router, wallet.token1, [
            trade.tokenOut.data.id,
            trade.tokenIn.data.id,
        ]);

        return {
            singleLoanPoolToken0Out,
            singleLoanPoolToken1Out,
            singleTargetToken0Out,
            singleTargetToken1Out,
        };
    };

    const flashTargetQuotes = async () => {
        // flashing token0 into token1
        const flashTargetToken1Out = await getAmountsOut(
            trade.target.router,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        const flashTargetToken0Out = await getAmountsOut(
            trade.target.router,
            trade.tradeSizes.target.tradeSizeTokenOut.size,
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );

        return {
            flashTargetToken0Out,
            flashTargetToken1Out,
        };
    };

    const flashLoanPoolQuotes = async () => {
        // tradeSize = token1 from loanPool
        const flashLoanPoolToken1Out = await getAmountsOut(
            trade.loanPool.router,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            [trade.tokenIn.data.id, trade.tokenOut.data.id],
        );

        // tradeSize = token1 from loanPool
        const flashLoanPoolToken0Out = await getAmountsOut(
            trade.loanPool.router,
            trade.tradeSizes.target.tradeSizeTokenOut.size,
            [trade.tokenOut.data.id, trade.tokenIn.data.id],
        );
        return {
            flashLoanPoolToken0Out,
            flashLoanPoolToken1Out,
        };
    };

    quotes = {
        target: {
            token0Out: (await walletQuotes()).singleTargetToken0Out,
            token1Out: (await walletQuotes()).singleTargetToken1Out,
            flashToken0Out: (await flashTargetQuotes()).flashTargetToken0Out,
            flashToken1Out: (await flashTargetQuotes()).flashTargetToken1Out,
        },
        loanPool: {
            token0Out: (await walletQuotes()).singleLoanPoolToken0Out,
            token1Out: (await walletQuotes()).singleLoanPoolToken1Out,
            flashToken0Out: (await flashLoanPoolQuotes()).flashLoanPoolToken0Out,
            flashToken1Out: (await flashLoanPoolQuotes()).flashLoanPoolToken1Out,
        },
    };
    console.log("quotes: ", quotes);
    return quotes;
}
