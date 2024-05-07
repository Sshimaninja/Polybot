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
import { swapIt as swap } from "./modules/transaction/swap";
import { trueProfit } from "./modules/trueProfit";
import { filterTrade } from "./modules/filterTrade";
import { signer } from "../../constants/provider";
// import { checkApprovalRouter, checkApprovalSingle } from "../../utils/approvals";
import { fetchGasPrice } from "./modules/transaction/fetchGasPrice";
import { params } from "./modules/transaction/params";
import { safetyChecks } from "./modules/transaction/safetyChecks";
import { fu } from "../modules/convertBN";
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

// export let pendingApprovals: { [address: string]: string } = {};

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
					pendingTransactions[match.poolBID + match.poolAID] ==
					true ||
					pendingTransactions[match.poolAID + match.poolBID] == true
				) {
					console.log(+
						"Pending transaction on ",
						match.ticker,
						pair.exchangeA,
						pair.exchangeB,
						" waiting...",
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
						console.log("No profit for trade: " + trade.ticker);
						return;
					}

					let safe = false;

					if ((trade.type = "single")) {
						safe = await safetyChecks(trade);
					}

					if (trade.type.includes("flash")) {
						safe = await filterTrade(trade);
					}

					await trueProfit(trade);

					// return;

					if (trade.profits.WMATICProfit < trade.gas.gasPrice) {
						console.log(
							"No profit after trueProfit: ",
							trade.ticker,
							trade.loanPool.exchange + trade.target.exchange,
							trade.type,
						);
						return;
					}

					// logger.info(log.tinyData);

					// EDIT: now only calling getchGasPrice once per block index.ts.
					// this is potentially slowing down tx execution to the point of falure for INSUFICCIENT_OUTPUT_AMOUNT
					let gas = await fetchGasPrice(trade);
					// trade.gas = gas;
					if (gas.tested == false) {
						console.log("Gas price not tested. Skipping trade.");
						return trade;
					}
					// const gasString = {
					//     gasPrice: fu(gas.gasPrice, 18),
					//     maxPriorityFee: fu(gas.maxPriorityFee, 9),
					//     tested: gas.tested,
					// };

					// console.log("trade.gas.tested :>> ", gasString);

					const logs = await tradeLogs(trade);
					logger.info(logs);

					let tx = null;
					if (trade.type.includes("flash")) {
						let tx = await flash(trade);
					}

					if (trade.type == "single") {
						let tx = await swap(trade);
					}
					if (tx !== null) {
						promises.push(tx);
					}
					await Promise.all(promises);
				} else {
					console.log(
						"Reserves not found for " +
						match.poolAID +
						" and " +
						match.poolBID,
					) +
						" reserves: " +
						reserves;
				}
			}
		}
	} catch (error: any) {
		if (error.code === "ECONNRESET") {
			console.log(
				"CONTROL ERROR: ECONNRESET: Connection reset by peer. Retrying.",
			);
		}
		console.log("Error in control.ts: " + error.reason);
		console.log(error);
	}
}
