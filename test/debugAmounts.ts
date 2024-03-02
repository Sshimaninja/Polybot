import {
    getAmountsIn as getAmountsInJS,
    getAmountsOut as getAmountOutJS,
} from "../scripts/v2/modules/price/getAmountsIOJS";
import {
    getAmountsIn as getAmountsInBN,
    getAmountsOut as getAmountsOutBN,
} from "../scripts/v2/modules/price/getAmountsIOBN";
// import { AmountsBN } from "../scripts/v2/modules/price/getAmountsBN";
import { BoolTrade } from "../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { logger } from "../constants/logger";
import { fu } from "../scripts/modules/convertBN";

export async function debugAmounts(
    trade: BoolTrade,
): Promise<{ amountOutEVM: string; amountOutBN: string; amountInEVM: string; amountInBN: string }> {
    const amountOutJS = await getAmountOutJS(
        trade.target.router,
        trade.target.tradeSize.token0.size,
        [trade.tokenIn.id, trade.tokenOut.id],
    );
    const amountInJS = await getAmountsInJS(
        trade.loanPool.router,
        trade.target.tradeSize.token0.size,
        [trade.tokenOut.id, trade.tokenIn.id],
    );
    const amountOutBN = await getAmountsOutBN(
        trade.target.tradeSize.token0.sizeBN,
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );
    const amountInBN = await getAmountsInBN(
        trade.target.tradeSize.token0.sizeBN,
        trade.target.reserveOutBN,
        trade.target.reserveInBN,
    );

    // CHECKING AMOUNTS AS THEY ARE DIFFERENT FROM WHAT THE CONTRACT RETURNS
    const allAmountsRaw = {
        amountOutEVM: fu(await amountOutJS, trade.tokenOut.decimals) + trade.tokenOut.symbol,
        amountOutBN: amountOutBN.toFixed(trade.tokenOut.decimals) + trade.tokenOut.symbol,
        amountInEVM: fu(await amountInJS, trade.tokenOut.decimals) + trade.tokenOut.symbol,
        amountInBN: amountInBN.toFixed(trade.tokenOut.decimals) + trade.tokenOut.symbol,
    };
    return allAmountsRaw;
    // console.log(">>>>>>>>>>>>CHECK AMOUNTS::::::::::::::");
    // console.log(allAmountsRaw);

    // const allAmounts = {
    //     amountOutLocal: fu(trade.quotes.target.token1, trade.tokenOut.decimals),
    //     amountOutEVM: fu(await amountOutJS[1], trade.tokenOut.decimals),
    //     amountOutBN: amountOutBN.toFixed(trade.tokenOut.decimals),
    //     amountInLocal: fu(trade.loanPool.amountRepay, trade.tokenIn.decimals),
    //     amountInEVM: fu(await amountInJS[0], trade.tokenIn.decimals),
    //     amountInBN: amountInBN.toFixed(trade.tokenIn.decimals),
    // // };
    // logger.info(">>>>>>>>>>>>CHECK AMOUNTSOUT::::::::::::::");
    // // logger.info(allAmounts);
    // return allAmounts;
}
