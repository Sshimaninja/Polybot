import { BoolTrade } from "../../../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { BigInt2BN } from "../../modules/convertBN";
import { importantSafetyChecks } from "./importantSafetyChecks";
import { tradeLogs } from "./tradeLog";

export async function filterTrade(trade: BoolTrade): Promise<boolean> {
    const liquidityThresholds: { [key: string]: number } = {
        WBTC: 0.001,
        WETH: 0.01,
        ETH: 0.01,
        default: 1,
    };

    const liquidityThresholdIn =
        liquidityThresholds[trade.tokenIn.data.symbol] || liquidityThresholds.default;
    const liquidityThresholdOut =
        liquidityThresholds[trade.tokenOut.data.symbol] || liquidityThresholds.default;

    if (!checkLiquidity(trade, "tokenIn", liquidityThresholdIn)) {
        return false;
    }
    if (!checkLiquidity(trade, "tokenOut", liquidityThresholdOut)) {
        return false;
    }

    const safe = await importantSafetyChecks(trade);
    if (!safe) {
        // trade.type = "filtered: failed safety checks";
        return false;
    }
    return true;
}

async function checkLiquidity(
    trade: BoolTrade,
    path: string,
    liquidityThreshold: number,
): Promise<boolean> {
    if (path === "tokenIn") {
        if (trade.loanPool.reserveInBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenIn.data.symbol + " liquidity on loanPool";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.loanPool.exchange, trade.loanPool.reserveInBN.toFixed(trade.tokenIn.data.decimals), trade.tokenIn.data.symbol);
            return false;
        }
        if (trade.target.reserveInBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenIn.data.symbol + " liquidity on target";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.target.exchange, trade.target.reserveInBN.toFixed(trade.tokenIn.data.decimals), trade.tokenIn.data.symbol);
            return false;
        }
    }
    if (path === "tokenOut") {
        if (trade.loanPool.reserveOutBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenOut.data.symbol + " liquidity on loanPool";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.loanPool.exchange, trade.loanPool.reserveOutBN.toFixed(trade.tokenOut.data.decimals), trade.tokenOut.data.symbol);
            return false;
        }
        if (trade.target.reserveOutBN.lt(BN(liquidityThreshold))) {
            trade.type = "filtered: Low " + trade.tokenOut.data.symbol + " liquidity on target";
            // console.log("[filteredTrade]: Insufficient liquidity: ", trade.ticker, trade.target.exchange, trade.target.reserveOutBN.toFixed(trade.tokenOut.data.decimals), trade.tokenOut.data.symbol);
            return false;
        }
    }
    // console.log("[filteredTrade]: Sufficient liquidity: ", trade.ticker);
    // console.log(await tradeLogs(trade));
    return true;
}
