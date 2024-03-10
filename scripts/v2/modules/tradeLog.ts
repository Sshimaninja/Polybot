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
            loanPool: {
                exchange: trade.loanPool.exchange,
                priceIn: trade.loanPool.priceIn,
                priceOut: trade.loanPool.priceOut,
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
                priceIn: trade.target.priceIn,
                priceOut: trade.target.priceOut,
                reservesIn:
                    fu(trade.target.reserveIn, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                reservesOut:
                    fu(trade.target.reserveOut, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
                // amountOutToken0for1:
                //     fu(trade.quotes.target.token1OutToken0for1, trade.tokenIn.data.decimals) +
                //     " " +
                //     trade.tokenIn.data.symbol,
                amountOut:
                    fu(trade.quotes.target.token1Out, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,
            },
            quotes: {
                loanPoolToken0:
                    fu(trade.quotes.loanPool.token0Out, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,

                loanPoolToken1:
                    fu(trade.quotes.loanPool.token1Out, trade.tokenOut.data.decimals) +
                    " " +
                    trade.tokenOut.data.symbol,

                targetToken0:
                    fu(trade.quotes.target.token0Out, trade.tokenIn.data.decimals) +
                    " " +
                    trade.tokenIn.data.symbol,
                targetToken1:
                    fu(trade.quotes.target.token1Out, trade.tokenOut.data.decimals) +
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
