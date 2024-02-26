import { BoolTrade } from "../../../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { BigInt2BN } from "../../modules/convertBN";
import { importantSafetyChecks } from "./importantSafetyChecks";
import { tradeLogs } from "./tradeLog";

export async function filterTrade(trade: BoolTrade): Promise<BoolTrade | undefined> {
    const liquidityThresholds: { [key: string]: number } = {
        WBTC: 0.01,
        WETH: 0.1,
        ETH: 0.1,
        default: 10,
    };

    const tradeSize = trade.target.tradeSize.sizeBN;
    const amountOut = BigInt2BN(trade.target.amountOut, trade.tokenOut.decimals);

    const liquidityThresholdIn =
        liquidityThresholds[trade.tokenIn.symbol] || liquidityThresholds.default;
    const liquidityThresholdOut =
        liquidityThresholds[trade.tokenOut.symbol] || liquidityThresholds.default;

    if (!checkLiquidity(trade, "tokenIn", liquidityThresholdIn)) {
        return undefined;
    }
    if (!checkLiquidity(trade, "tokenOut", liquidityThresholdOut)) {
        return undefined;
    }

    const safe = await importantSafetyChecks(trade);
    if (!safe) {
        // trade.type = "filtered: failed safety checks";
        return undefined;
    }
    return trade;
}

async function checkLiquidity(trade: BoolTrade, path: string, liquidityThreshold: number) {
    if (path === "tokenIn") {
        if (trade.loanPool.reserveInBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenIn.symbol + " liquidity on loanPool";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.loanPool.exchange, trade.loanPool.reserveInBN.toFixed(trade.tokenIn.decimals), trade.tokenIn.symbol);
            return false;
        }
        if (trade.target.reserveInBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenIn.symbol + " liquidity on target";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.target.exchange, trade.target.reserveInBN.toFixed(trade.tokenIn.decimals), trade.tokenIn.symbol);
            return false;
        }
    }
    if (path === "tokenOut") {
        if (trade.loanPool.reserveOutBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenOut.symbol + " liquidity on loanPool";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.loanPool.exchange, trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.decimals), trade.tokenOut.symbol);
            return false;
        }
        if (trade.target.reserveOutBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenOut.symbol + " liquidity on target";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.target.exchange, trade.target.reserveOutBN.toFixed(trade.tokenOut.decimals), trade.tokenOut.symbol);
            return false;
        }
    }
    // console.log("[filteredTrade]: Sufficient liquidity: ", trade.ticker);
    // console.log(await tradeLogs(trade));
    return true;
}
