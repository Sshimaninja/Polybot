require("dotenv").config();
require("colors");
import fs from "fs";
import { BigNumber as BN } from "bignumber.js";
import { Prices } from "./classes/Prices";
import { BoolTrade, FactoryPair, TradePair } from "../../constants/interfaces";
import { Trade } from "./Trade";
import { Reserves } from "./modules/reserves";
import { tradeLogs } from "./modules/tradeLog";
import { logger } from "../../constants/logger";
import { slip } from "../../constants/environment";
import { flash } from "./modules/transaction/flash";
import { swap } from "./modules/transaction/swap";
import { trueProfit } from "./modules/trueProfit";
import { filterTrade } from "./modules/filterTrade";
import { signer } from "../../constants/provider";
import { checkApprovalRouter, checkApprovalSingle } from "../../utils/approvals";
import { fetchGasPrice } from "./modules/transaction/fetchGasPrice";
import { params } from "./modules/transaction/params";
// import { filterMatches } from "./filterMatches";
/*
TODO:
*/
/**
 * @param data
 * @param gasData
 * @description
 * This function controls the execution of the flash swaps.
 * It loops through all pairs, and all matches, and executes the flash swaps.
 * It prevents multiple flash swaps from being executed at the same time, on the same pool, if the profit is too low, or the gas cost too high.
 */
let filteredTrades: string[]; // Array to store filtered trades
export let pendingTransactions: { [poolAddress: string]: boolean } = {};
export let pendingApprovals: { [address: string]: string } = {};

logger.info("Control.ts: pendingTransactions: ");
logger.info(pendingTransactions);
export async function control(data: FactoryPair[], gasData: any) {
    const promises: any[] = [];
    try {
        for (const pair of data) {
            for (const match of pair.matches) {
                const r = new Reserves(match);

                const reserves = await r.getReserves(match);

                // Use a second Trade class to get the reverse route
                if (
                    pendingTransactions[match.poolBID + match.poolAID] == true ||
                    pendingTransactions[match.poolAID + match.poolBID] == true
                ) {
                    console.log(
                        "Pending transaction on ",
                        match.ticker,
                        pair.exchangeA,
                        pair.exchangeB,
                        " Skipping trade.",
                    );
                    return;
                }
                if (reserves[0] !== undefined || reserves[1] !== undefined) {
                    const p0 = new Prices(match.poolAID, reserves[0]);
                    const p1 = new Prices(match.poolBID, reserves[1]);

                    const t = new Trade(pair, match, p0, p1, slip, gasData);
                    let trade: BoolTrade = await t.getTrade();

                    // return;
                    if (trade.profits.tokenProfit <= 0) {
                        // console.log("No profit for trade: " + trade.ticker);
                        return;
                    }

                    let approved = 0n;
                    if (trade.type == "single") {
                        approved = await checkApprovalRouter(trade);
                    }
                    if (trade.type == "single" && approved > 0n) {
                        approved = await checkApprovalSingle(trade);
                    }
                    if (approved < trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
                        return;
                    }
                    trade.params = await params(trade);

                    let gas = await fetchGasPrice(trade);
                    if (gas.tested == false) {
                        console.log("Gas price not tested. Skipping trade.");
                        return;
                    }

                    await trueProfit(trade);
                    // return;
                    await filterTrade(trade);

                    const log = await tradeLogs(trade);
                    // logger.info(log);

                    if (trade.profits.WMATICProfit < trade.gas.gasPrice) {
                        // console.log("No profit after trueProfit: ", log.tinyData);
                        return;
                    }
                    if (trade.profits.WMATICProfit > trade.gas.gasPrice) {
                        logger.info(log.tinyData);
                    }

                    if (trade.type.includes("flash")) {
                        console.log("Executing flash swap for trade: " + trade.ticker);
                        let tx = await flash(trade);
                    }
                    if (trade.type == "single") {
                        // console.log(
                        //     "Executing swap for trade: " +
                        //         trade.ticker +
                        //         " for profit: " +
                        //         trade.profits.WMATICProfit,
                        // );
                        let tx = await swap(trade);
                        if (tx !== null) {
                            promises.push(tx);
                        }
                    }
                    if (trade.type.includes("filtered")) {
                        console.log("Filtered trade: " + trade.ticker);
                    }
                } else {
                    console.log(
                        "Reserves not found for " + match.poolAID + " and " + match.poolBID,
                    ) +
                        " reserves: " +
                        reserves;
                }
            }
        }
    } catch (error: any) {
        if (error.code === "ECONNRESET") {
            console.log("CONTROL ERROR: ECONNRESET: Connection reset by peer. Retrying.");
        }
        console.log("Error in control.ts: " + error.reason);
        console.log(error);
    }
}
