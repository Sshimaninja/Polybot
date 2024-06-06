import { flashMulti, flashSingle, swap } from "../../constants/environment";
import { getQuotes } from "./modules/price/getQuotes";
import { getK } from "./modules/tools/getK";
import { walletTradeSize } from "./modules/tools/walletTradeSizes";
import { BoolTrade } from "../../constants/interfaces";
import { PopulateRepays } from "./classes/Repays";
import { AmountConverter } from "./classes/AmountConverter";
import { ProfitCalculator } from "./classes/ProfitCalcs";
import { fetchGasPrice } from "./modules/transaction/fetchGasPrice";
import { tradeLogs } from "./modules/tradeLog";
import { logger } from "../../constants/logger";
import { params } from "./modules/transaction/params";

export async function populateTrade(trade: BoolTrade): Promise<BoolTrade> {
	const calc = new AmountConverter(trade);
	trade.tradeSizes = await calc.getSize();

	// let logs = await tradeLogs(trade);
	// logger.info(logs);

	// EDIT: now only calling getchGasPrice once per block index.ts.
	// if (trade.gas.tested == false) {
	//     let gas = await fetchGasPrice(trade);
	//     if (gas.tested == false) {
	//         console.log("Gas price not tested. Skipping trade.");
	//         return trade;
	//     }
	//     trade.gas.tested = true;
	// }

	const quotes = await getQuotes(trade);

	const r = new PopulateRepays(trade, calc);
	const repays = await r.getRepays();
	trade.loanPool.repays = repays;

	const profitCalc = new ProfitCalculator(trade, calc, repays, quotes);
	let p = {
		multi: await profitCalc.getMultiProfit(),
		single: await profitCalc.getSingleProfit(),
		flashMulti: await profitCalc.getMultiFlashProfit(),
		flashSingle: await profitCalc.getSingleFlashProfit(),
	};
	// if (
	//     multi.flashProfit <= 0n &&
	//     multi.singleProfit <= 0n &&
	//     single.flashProfit <= 0n &&
	//     single.singleProfit <= 0n
	// ) {
	//     trade.type = "filtered: 0 profit";
	//     return trade;
	// }

	let swapProfit = p.multi > p.single ? p.multi : p.single;
	let flashProfit =
		p.flashMulti > p.flashSingle ? p.flashMulti : p.flashSingle;

	let maxProfit = swapProfit > flashProfit ? swapProfit : flashProfit;

	trade.profits.tokenProfit = maxProfit;

	if (maxProfit === p.multi) {
		trade.type = "multi";
	}
	if (maxProfit === p.single) {
		trade.type = "single";
	}
	if (maxProfit === p.flashMulti) {
		trade.type = "flashMulti";
	}
	if (maxProfit === p.flashSingle) {
		trade.type = "flashSingle";
	}

	trade.loanPool.amountRepay =
		trade.type === "flashMulti"
			? repays.flashMulti
			: trade.type === "flashSingle"
				? repays.flashSingle
				: 0n; // Regular swaps have no repay as there is no loan.

	if (trade.type === "single" || trade.type === "multi") {
		trade.quotes = {
			target: {
				tokenInOut: quotes.target.tokenInOut,
				tokenOutOut: quotes.target.tokenOutOut,
			},
			loanPool: {
				tokenInOut: quotes.loanPool.tokenInOut,
				tokenOutOut: quotes.loanPool.tokenOutOut,
			},
		};
	}
	if (trade.type.includes("flash"))
		trade.quotes = {
			target: {
				tokenInOut: quotes.target.flashTokenInOut,
				tokenOutOut: quotes.target.flashTokenOutOut,
			},
			loanPool: {
				tokenInOut: quotes.loanPool.flashTokenInOut,
				tokenOutOut: quotes.loanPool.flashTokenOutOut,
			},
		};

	trade.k = await getK(
		trade.type,
		trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
		trade.loanPool.reserveIn,
		trade.loanPool.reserveOut,
		calc,
	);

	if (trade.type === "single" || trade.type === "multi") {
		trade.contract = swap;
	}
	if (trade.type === "flashMulti") {
		trade.contract = flashMulti;
	}
	if (trade.type === "flashSingle") {
		trade.contract = flashSingle;
	}

	trade.params = await params(trade);

	return trade;
}
