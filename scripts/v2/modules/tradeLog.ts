import { BoolTrade } from "../../../constants/interfaces";
import { BigInt2BN, fbi, fu } from "../../modules/convertBN";

export async function tradeLogs(trade: BoolTrade): Promise<any> {
    try {
        const data = {
            id: trade.ID,
            block: trade.block,
            trade: trade.type,
            ticker: trade.ticker,
            direction: trade.direction,
            tradeSize:
                fu(trade.tradeSizes.loanPool.tradeSizeTokenIn.size, trade.tokenIn.data.decimals) +
                " " +
                trade.tokenIn.data.symbol,
            tokenIn: {
                symbol: trade.tokenIn.data.symbol,
                decimals: trade.tokenIn.data.decimals,
                id: trade.tokenIn.data.id,
            },
            tokenOut: {
                symbol: trade.tokenOut.data.symbol,
                decimals: trade.tokenOut.data.decimals,
                id: trade.tokenOut.data.id,
            },
            wallet: {
                balanceIn:
                    fu(trade.wallet.tokenInBalance, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                balanceOut:
                    fu(trade.wallet.tokenOutBalance, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
            },
            loanPool: {
                exchange: trade.loanPool.exchange,
                priceIn: trade.loanPool.priceIn.toFixed(trade.tokenIn.data.decimals),
                priceOut: trade.loanPool.priceOut.toFixed(trade.tokenOut.data.decimals),
                reservesIn:
                    fu(trade.loanPool.reserveIn, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                reservesOut:
                    fu(trade.loanPool.reserveOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
                repays: {
                    single: fu(trade.loanPool.repays.single, trade.tokenOut.data.decimals),
                    flashSingle: fu(
                        trade.loanPool.repays.flashSingle,
                        trade.tokenOut.data.decimals,
                    ),
                    flashMulti: fu(trade.loanPool.repays.flashMulti, trade.tokenOut.data.decimals),
                },

                amountRepay:
                    trade.loanPool.amountRepay +
                    ": " +
                    fu(trade.loanPool.amountRepay, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
                // : trade.type === "flashSingle"
                // ? fu(trade.loanPool.amountRepay, trade.tokenIn.data.decimals) +
                //   " " +
                //   trade.tokenIn.data.symbol
                // : "no trade",
            },
            target: {
                exchange: trade.target.exchange,
                priceIn: trade.target.priceIn.toFixed(trade.tokenIn.data.decimals),
                priceOut: trade.target.priceOut.toFixed(trade.tokenOut.data.decimals),
                reservesIn:
                    fu(trade.target.reserveIn, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                reservesOut:
                    fu(trade.target.reserveOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
                // amountOutToken0for1:
                //     fu(trade.quotes.target.tokenOutOutToken0for1, trade.tokenIn.data.decimals) +
                //     " " +
                //     trade.tokenIn.data.symbol,
                amountOut:
                    fu(trade.quotes.target.tokenOutOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
            },
            quotes: {
                loanPoolToken0:
                    fu(trade.quotes.loanPool.tokenInOut, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,

                loanPoolToken1:
                    fu(trade.quotes.loanPool.tokenOutOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,

                targetToken0:
                    fu(trade.quotes.target.tokenInOut, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                targetToken1:
                    fu(trade.quotes.target.tokenOutOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
            },

            gas: {
                gasEstimate: trade.gas.gasEstimate,
                maxFee: trade.gas.maxFee,
                maxPriorityFee: trade.gas.maxPriorityFee,
            },
            result: {
                uniswapkPreT: trade.k.uniswapKPre > 0n ? trade.k.uniswapKPre.toString() : 0,
                uniswapkPosT: trade.k.uniswapKPost > 0n ? trade.k.uniswapKPost.toString() : 0,
                uniswapKPositive: trade.k.uniswapKPositive,
                tokenProfit:
                    fu(trade.profits.tokenProfit, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
                wmaticProfit: fu(trade.profits.WMATICProfit, 18) + " WMATIC",
            },
        };

        const tinyData =
            "Trade: " +
            trade.ticker +
            " | " +
            trade.type +
            " | " +
            trade.loanPool.exchange +
            " | " +
            trade.target.exchange +
            " | Gas: " +
            fu(trade.gas.gasPrice, 18) +
            " | WMATIC Profit: " +
            fu(trade.profits.WMATICProfit, 18);

        return { data, tinyData };
    } catch (error: any) {
        console.log("Error in tradeLog.ts: " + error.message);
        console.log(error);
        return { data: "error" };
    }
}
