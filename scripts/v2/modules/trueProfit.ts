import { BoolTrade, TradeGas, TradeProfit } from "../../../constants/interfaces";
import { Profit } from "../../../constants/interfaces";
import { gasTokens, uniswapV2Exchange } from "../../../constants/addresses";
import { fetchGasPrice } from "./transaction/fetchGasPrice";
import { WMATICProfit } from "../classes/WMATICProfit";
import { tradeLogs } from "./tradeLog";
import { fu } from "../../modules/convertBN";
import { logger } from "../../../constants/logger";
import { Console } from "console";
require("dotenv").config();
/**
 * Determines whether the profit is greater than the gas cost.
 * @param trade
 * @returns Profit{profit: string, gasEstimate: bigint, gasCost: bigint, gasPool: string}
 */
export async function trueProfit(trade: BoolTrade): Promise<BoolTrade> {
    try {
        // Get gas prices
        let gas = await fetchGasPrice(trade);
        // update trade with gaPrices
        trade.gas = {
            gasPrice: gas.gasPrice,
            gasEstimate: gas.gasEstimate,
            maxFee: gas.maxFee,
            maxPriorityFee: gas.maxPriorityFee,
        };

        // Calculate profit & compare to gas cost
        let WMATICprofit = new WMATICProfit(trade, gasTokens, uniswapV2Exchange);
        let profitInWMATIC = await WMATICprofit.getWMATICProfit();
        trade.profits.WMATICProfit = profitInWMATIC;

        let logs = await tradeLogs(trade);
        return trade;
    } catch (error: any) {
        logger.error("Error in trueProfit: ", error);
        return trade;
    }
}
