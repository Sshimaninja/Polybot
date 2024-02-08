import { BoolTrade } from "../../../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { BigInt2BN, pu } from "../../modules/convertBN";
import { importantSafetyChecks } from "./importantSafetyChecks";
import { checkTrade } from "./checkTrade";
import fs from "fs";
/**
 * @param trade
 * @description
 * This function filters out trades that are not profitable, or have insufficient liquidity.
 */

export async function filterTrade(trade: BoolTrade): Promise<BoolTrade | undefined> {
    const shitLiq = BN(10);
    const WBTCliq = BN(0.01);
    const ETHliq = BN(0.1);
    const tradeSize = BigInt2BN(trade.target.tradeSize, trade.tokenOut.decimals);
    const amountOut = BigInt2BN(trade.target.amountOut, trade.tokenOut.decimals);
    if (tradeSize.lte(0)) {
        console.log(
            "[filteredTrade]: trade.target.tradeSize is less than or equal to 0. No trade. TradeSize: ",
            tradeSize.toFixed(trade.tokenIn.decimals),
            trade.tokenIn.symbol,
        );
        return undefined;
    }
    if (amountOut.lte(0)) {
        console.log(
            "[filteredTrade]: trade.target.amountOut is less than or equal to 0. No trade. AmountOut: ",
            amountOut.toFixed(trade.tokenOut.decimals),
            trade.tokenOut.symbol,
        );
        return undefined;
    }
    if (trade.tokenIn.symbol === "WBTC") {
        if (trade.loanPool.reserveInBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
    }
    if (trade.tokenOut.symbol === "WBTC") {
        if (trade.loanPool.reserveOutBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveOutBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
            );
            return undefined;
        }
    }
    if (trade.tokenIn.symbol === "WBTC") {
        if (trade.loanPool.reserveInBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(WBTCliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
    }
    if (trade.tokenOut.symbol === "WETH" || trade.tokenOut.symbol === "ETH") {
        if (trade.loanPool.reserveOutBN.lt(BN(ETHliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveOutBN.lt(BN(ETHliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "WBTC reserves: ",
                trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
            );
            return undefined;
        }
    }
    if (trade.tokenIn.symbol === "WETH" || trade.tokenIn.symbol === "ETH") {
        if (trade.loanPool.reserveInBN.lt(BN(ETHliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(ETHliq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
    } else {
        if (trade.loanPool.reserveInBN.lt(BN(shitLiq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveInBN.lt(BN(shitLiq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveInBN.toFixed(trade.tokenIn.decimals),
                trade.tokenIn.symbol,
            );
            return undefined;
        }
        if (trade.loanPool.reserveOutBN.lt(BN(shitLiq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on loanPool exchange: ",
                trade.ticker,
                " ",
                trade.loanPool.exchange,
                ": No trade.",
                "reserves: ",
                trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
            );
            return undefined;
        }
        if (trade.target.reserveOutBN.lt(BN(shitLiq))) {
            console.log(
                "[filteredTrade]: Insufficient liquidity on target exchange: ",
                trade.ticker,
                " ",
                trade.target.exchange,
                ": No trade.",
                "reserves: ",
                trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals),
                trade.tokenOut.symbol,
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
    const safe = await importantSafetyChecks(trade);
    if (!safe) {
        // console.log("[filteredTrade]: Important safety checks failed. No trade.");
        return undefined;
    }
    return trade;
}
