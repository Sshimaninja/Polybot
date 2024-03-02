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
                fu(trade.tradeSizes.pool0.token0.size, trade.tokenIn.decimals) +
                " " +
                trade.tokenIn.symbol,
            tokenIn: { symbol: trade.tokenIn.symbol, decimals: trade.tokenIn.decimals },
            tokenOut: { symbol: trade.tokenOut.symbol, decimals: trade.tokenOut.decimals },
            loanPool: {
                exchange: trade.loanPool.exchange,
                priceIn: trade.loanPool.priceIn,
                priceOut: trade.loanPool.priceOut,
                reservesIn:
                    fu(trade.loanPool.reserveIn, trade.tokenIn.decimals) +
                    " " +
                    trade.tokenIn.symbol,
                reservesOut:
                    fu(trade.loanPool.reserveOut, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
                repays: {
                    single: fu(trade.loanPool.repays.single, trade.tokenOut.decimals),
                    flashSingle: fu(trade.loanPool.repays.flashSingle, trade.tokenOut.decimals),
                    flashMulti: fu(trade.loanPool.repays.flashMulti, trade.tokenOut.decimals),
                },

                amountRepay:
                    trade.loanPool.amountRepay +
                    ": " +
                    fu(trade.loanPool.amountRepay, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
                // : trade.type === "flashSingle"
                // ? fu(trade.loanPool.amountRepay, trade.tokenIn.decimals) +
                //   " " +
                //   trade.tokenIn.symbol
                // : "no trade",
            },
            target: {
                exchange: trade.target.exchange,
                priceIn: trade.target.priceIn,
                priceOut: trade.target.priceOut,
                reservesIn:
                    fu(trade.target.reserveIn, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
                reservesOut:
                    fu(trade.target.reserveOut, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
                // amountOutToken0for1:
                //     fu(trade.quotes.target.token1OutToken0for1, trade.tokenIn.decimals) +
                //     " " +
                //     trade.tokenIn.symbol,
                amountOut:
                    fu(trade.quotes.target.token1Out, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
            },
            quotes: {
                loanPoolToken0:
                    fu(trade.quotes.loanPool.token0Out, trade.tokenIn.decimals) +
                    " " +
                    trade.tokenIn.symbol,

                loanPoolToken1:
                    fu(trade.quotes.loanPool.token1Out, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,

                targetToken0:
                    fu(trade.quotes.target.token0Out, trade.tokenIn.decimals) +
                    " " +
                    trade.tokenIn.symbol,
                targetToken1:
                    fu(trade.quotes.target.token1Out, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
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
                    fu(trade.profits.tokenProfit, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
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
