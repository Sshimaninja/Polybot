import { BoolTrade } from "../../../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { BigInt2BN } from "../../modules/convertBN";
import { checkTrade } from "./checkTrade";
import fs from "fs";
/**
 * @param trade
 * @description
 * This function filters out trades that are not profitable, or have insufficient liquidity.
 */
export async function filterTrade(trade: BoolTrade): Promise<BoolTrade | undefined> {
    const tradeSize = BigInt2BN(trade.target.tradeSize, trade.tokenOut.decimals);
    const amountOut = BigInt2BN(trade.target.amountOut, trade.tokenOut.decimals);
    if (tradeSize.lte(0)) {
        console.log(
            "[filteredTrade]: trade.target.tradeSize is less than or equal to 0. No trade. TradeSize: ",
            tradeSize.toFixed(trade.tokenIn.decimals),
        );
        return undefined;
    }
    if (amountOut.lte(0)) {
        console.log(
            "[filteredTrade]: trade.target.amountOut is less than or equal to 0. No trade. AmountOut: ",
            amountOut.toFixed(trade.tokenOut.decimals),
        );
        return undefined;
    }
    if (trade.tokenIn.symbol === "WBTC") {
        if (trade.loanPool.reserveInBN.lt(BN(0.05))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(0.05))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
            );
            return undefined;
        }
    }
    if (trade.tokenOut.symbol === "WBTC") {
        if (trade.loanPool.reserveOutBN.lt(BN(0.05))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals),
            );
            return undefined;
        }
        if (trade.target.reserveOutBN.lt(BN(0.05))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals),
            );
            return undefined;
        }
    }
    if (trade.tokenIn.symbol !== "WBTC") {
        if (trade.loanPool.reserveInBN.lt(BN(4))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(4))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
            );
            return undefined;
        }
    }
    if (trade.tokenOut.symbol !== "WBTC") {
        if (trade.loanPool.reserveOutBN.lt(BN(4))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals),
            );
            return undefined;
        }
        if (trade.target.reserveOutBN.lt(BN(4))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals),
            );
            return undefined;
        }
    }
    // const validTrade = await checkTrade(trade);
    // if (validTrade) {
    //     return trade;
    // } else {
    //     console.log("[filteredTrade]: Invalid trade. No trade.");
    //     return undefined;
    // }
    return trade;
}
