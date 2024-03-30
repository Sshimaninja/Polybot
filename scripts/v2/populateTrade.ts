import { flashMulti, flashSingle } from "../../constants/environment";
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

    const p = new ProfitCalculator(trade, calc, repays, quotes);
    const multi = await p.getMultiProfit();
    const single = await p.getSingleProfit();

    if (
        multi.flashProfit <= 0n &&
        multi.singleProfit <= 0n &&
        single.flashProfit <= 0n &&
        single.singleProfit <= 0n
    ) {
        trade.type = "filtered: 0 profit";
        return trade;
    }

    let maxProfit =
        multi.flashProfit > single.flashProfit
            ? multi.flashProfit
            : single.flashProfit;

    let singleProfit =
        multi.singleProfit > single.singleProfit
            ? multi.singleProfit
            : single.singleProfit;

    maxProfit = maxProfit > singleProfit ? maxProfit : singleProfit;

    trade.type =
        maxProfit === multi.singleProfit
            ? "multi"
            : single.singleProfit
            ? "single"
            : maxProfit === multi.flashProfit
            ? "flashMulti"
            : maxProfit === single.flashProfit
            ? "flashSingle"
            : maxProfit === 0n
            ? "filtered: 0 profit"
            : "filtered: unknown";

    trade.profits.tokenProfit = maxProfit;

    let walletTradeSizes = await walletTradeSize(trade);

    trade.profits.tokenProfit =
        trade.type === "single"
            ? single.singleProfit
            : trade.type === "multi"
            ? multi.singleProfit
            : trade.type === "flashMulti"
            ? multi.flashProfit
            : trade.type === "flashSingle"
            ? single.flashProfit
            : 0n;

    trade.loanPool.amountRepay =
        trade.type === "flashMulti"
            ? repays.flashMulti
            : trade.type === "flashSingle"
            ? repays.flashSingle
            : repays.single;

    trade.type === "single" || trade.type === "multi"
        ? (trade.quotes = {
              target: {
                  tokenInOut: quotes.target.tokenInOut,
                  tokenOutOut: quotes.target.tokenOutOut,
              },
              loanPool: {
                  tokenInOut: quotes.loanPool.tokenInOut,
                  tokenOutOut: quotes.loanPool.tokenOutOut,
              },
          })
        : (trade.quotes = {
              target: {
                  tokenInOut: quotes.target.flashTokenInOut,
                  tokenOutOut: quotes.target.flashTokenOutOut,
              },
              loanPool: {
                  tokenInOut: quotes.loanPool.flashTokenInOut,
                  tokenOutOut: quotes.loanPool.flashTokenOutOut,
              },
          });

    trade.k = await getK(
        trade.type,
        trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
        trade.loanPool.reserveIn,
        trade.loanPool.reserveOut,
        calc,
    );

    trade.flash = trade.type === "flashSingle" ? flashSingle : flashMulti;

    trade.params = await params(trade);

    return trade;
}
