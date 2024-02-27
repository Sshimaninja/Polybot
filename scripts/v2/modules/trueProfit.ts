import { BoolTrade, TradeGas, TradeProfit } from "../../../constants/interfaces";
import { Profit } from "../../../constants/interfaces";
import { gasTokens, uniswapV2Exchange } from "../../../constants/addresses";
import { fetchGasPrice } from "./transaction/fetchGasPrice";
import { WMATICProfit } from "../classes/WMATICProfit";
import { fu } from "../../modules/convertBN";
import { logger } from "../../../constants/logger";
require("dotenv").config();
/**
 * Determines whether the profit is greater than the gas cost.
 * @param trade
 * @returns Profit{profit: string, gasEstimate: bigint, gasCost: bigint, gasPool: string}
 */
export async function trueProfit(trade: BoolTrade): Promise<BoolTrade> {
    try {
        // Get gas prices
        let gasPrices = await fetchGasPrice(trade);
        // update trade with gaPrices
        trade.gas = {
            gasPrice: gasPrices.gasPrice,
            gasEstimate: gasPrices.gasEstimate,
            maxFee: gasPrices.maxFee,
            maxPriorityFee: gasPrices.maxPriorityFee,
        };

        // Calculate profit & compare to gas cost
        // if (gasPrices.tested === true) {
        let WMATICprofit = new WMATICProfit(trade, gasTokens, uniswapV2Exchange);
        let profitInWMATIC = await WMATICprofit.getWMATICProfit();
        // logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>trueProfit: ", profitInWMATIC);

        trade.profits.WMATICProfit = profitInWMATIC;
        // if (trade.profits.WMATICProfit > trade.gas.gasPrice) {
        //     console.log(
        //         "Possible trade: " + trade.ticker + " Gas Estimate: ",
        //         fu(gasPrices.gasEstimate, 18),
        //         "Gas Price: ",
        //         fu(gasPrices.gasPrice, 18),
        //     );
        //     console.log("Profit: ", fu(trade.profits.WMATICProfit, 18));
        //     return trade;
        // }

        return trade;
    } catch (error: any) {
        logger.error("Error in trueProfit: ", error);
        return trade;
    }
    // }

    // console.log("Gas estimate failed for " + trade.ticker);
    // return trade;
}
