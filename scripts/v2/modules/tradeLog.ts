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
                fu(trade.target.tradeSize.size, trade.tokenIn.decimals) +
                " " +
                trade.tokenIn.symbol,
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
                repaysObj: {
                    // single:
                    //     fu(trade.loanPool.repays.single.singleIn, trade.tokenIn.decimals) +
                    //     " " +
                    //     trade.tokenIn.symbol,
                    // singleOut:
                    //     fu(trade.loanPool.repays.single.singleOut, trade.tokenOut.decimals) +
                    //     " " +
                    //     trade.tokenOut.symbol,
                    multi:
                        fu(trade.loanPool.repays.multi, trade.tokenOut.decimals) +
                        " " +
                        trade.tokenOut.symbol,
                },
                // amountOut:
                //     fbi(trade.loanPool.amountOut, trade.tokenOut.decimals) +
                //     " " +
                //     trade.tokenOut.symbol,
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
                //     fu(trade.quotes.target.flashOutToken0for1, trade.tokenIn.decimals) +
                //     " " +
                //     trade.tokenIn.symbol,
                amountOut:
                    fu(trade.quotes.target.flashOut, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
            },
            result: {
                uniswapkPreT: trade.k.uniswapKPre > 0n ? trade.k.uniswapKPre.toString() : 0,
                uniswapkPosT: trade.k.uniswapKPost > 0n ? trade.k.uniswapKPost.toString() : 0,
                uniswapKPositive: trade.k.uniswapKPositive,
                // loanCostPercent: fu((trade.loanPool.amountOut.div(trade.amountRepay)).mul(100), trade.tokenOut.decimals),
                tokenProfit:
                    fu(trade.profits.tokenProfit, trade.tokenOut.decimals) +
                    " " +
                    trade.tokenOut.symbol,
                wmaticProfit: fu(trade.profits.WMATICProfit, 18) + " WMATIC",
                profperc: fu(trade.profits.profitPercent, trade.tokenOut.decimals) + "%",
            },
        };

        return data;
    } catch (error: any) {
        console.log("Error in tradeLog.ts: " + error.message);
        console.log(error);
        return { data: "error" };
    }
}
