import { BoolTrade } from "../../../constants/interfaces";
import { pendingTransactions } from "../control";
import { logger } from "../../../constants/logger";
import { ethers, TransactionReceipt } from "ethers";
import { execute } from "./transaction/flash";
import { swap } from "./transaction/swap";
import { fu } from "../../modules/convertBN";

export async function sortTx(trade: BoolTrade): Promise<TransactionReceipt | undefined> {
    if (trade.profits.WMATICProfit > trade.gas.gasPrice) {
        trade.pending = true;
        logger.info(
            "====================" +
                "Profitable trade found on " +
                trade.ticker +
                "!" +
                "====================",
        );
        logger.info(
            "Ticker: ",
            trade.ticker,
            " | ",
            "Loan Pool: ",
            trade.loanPool.exchange,
            " | ",
            "Target: ",
            trade.target.exchange,
            " | ",
            "Trade Size: ",
            fu(trade.tradeSizes.pool0.token0.size, trade.tokenIn.decimals),
            "Profit: ",
            fu(trade.profits.WMATICProfit, 18),
            "Gas Cost: ",
            fu(trade.gas.gasPrice, 18),
            "Flash Type: ",
            trade.type,
        );
        logger.info("====================" + "Trade Data " + trade.ticker + "====================");
    }
    try {
        let tx;
        let receipt: TransactionReceipt | undefined;
        pendingTransactions[trade.ID] = true;
        // Execute trade
        if (trade.type == "flashMulti" || trade.type == "flashSingle") {
            tx = await flash(trade);
        }
        if (trade.type == "single") {
            tx = await swap(trade);
        }
        if (receipt?.status == 1) {
            pendingTransactions[trade.ID] = false;
            return receipt;
        }
        // if execute returns either txresponse or undefined, remove it from pendingTrades:
    } catch (error) {
        logger.error("Error executing trade: ", error);
    }
    return undefined;
}
