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
            token1: trade.quotes.target.token1,
            token0: trade.quotes.target.token0,
            flashToken0: trade.quotes.target.flashToken0,
            flashToken1: trade.quotes.target.token1,
        },
        loanPool: {
            token1: trade.quotes.loanPool.token1,
            token0: trade.quotes.loanPool.token0,
            flashToken0: trade.quotes.loanPool.flashToken0,
            flashToken1: trade.quotes.loanPool.token1,
        },
    };

    interface WalletTradeSizes {
        token0: bigint;
        token1: bigint;
    }
    let walletTradeSize = async (): Promise<WalletTradeSizes> => {
        let size: WalletTradeSizes = {
            token0: trade.target.tradeSize.token0.size,
            token1: trade.wallet.token1Balance,
        };
        let funds = trade.wallet.token0Balance;

        if (funds > trade.target.tradeSize.token0.size) {
            size.token0 = trade.target.tradeSize.token0.size;
        }
        let tradeSizetoken1BN = await tradeToPrice(
            trade.loanPool.reserveOutBN,
            trade.loanPool.reserveInBN,
            BN(trade.target.priceIn),
            slip,
        );
        let tradeSizetoken1 = BN2BigInt(tradeSizetoken1BN, trade.tokenIn.decimals);
        size = {
            token0: size.token0,
            token1: tradeSizetoken1,
        };
        return size;
    };

    let wallet = await walletTradeSize();

    ///YOU CAN'T PASS IN TRADESIZE TO GET AMOUTN OF token0 OUT

    if (wallet.token0 <= 0 && wallet.token1 <= 0) {
        return trade;
    }
    if (trade.target.tradeSize.token0.size <= 0) {
        return trade;
    }

    const singleTargettoken1 = await getAmountsOut(trade.target.router, wallet.token0, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleLoanPooltoken1 = await getAmountsOut(trade.loanPool.router, wallet.token0, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);

    const singleTargettoken0 = await getAmountsOut(trade.target.router, wallet.token1, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const singleLoanPooltoken0 = await getAmountsOut(trade.loanPool.router, wallet.token1, [
        trade.tokenOut.id,
        trade.tokenIn.id,
    ]);

    const flashTargettoken1 = await getAmountsOut(
        trade.target.router,
        trade.target.tradeSize.token0.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    const flashLoanPooltoken1 = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.token0.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );

    const flashTargettoken0 = await getAmountsOut(
        trade.target.router,
        trade.loanPool.tradeSize.token0.size,
        [trade.tokenOut.id, trade.tokenIn.id],
    );

    const flashLoanPooltoken0 = await getAmountsOut(
        trade.loanPool.router,
        trade.target.tradeSize.token0.size,
        [trade.tokenOut.id, trade.tokenIn.id],
    );

    trade.quotes = {
        target: {
            token1: singleTargettoken1,
            token0: singleTargettoken0,
            flashToken0: flashTargetToken0,
            flashToken1: flashTargettoken1,
        },
        loanPool: {
            token1: singleLoanPooltoken1,
            token0: singleLoanPooltoken0,
            flashToken0: flashLoanPoolToken0,
            flashToken1: flashLoanPooltoken1,
        },
    };

    return trade;
}
