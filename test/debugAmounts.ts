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
        trade.tradeSizes.pool0.token0.size,
        [trade.tokenIn.data.id, trade.tokenOut.data.id],
    );
    const amountInJS = await getAmountsInJS(
        trade.loanPool.router,
        trade.tradeSizes.pool0.token0.size,
        [trade.tokenOut.data.id, trade.tokenIn.data.id],
    );
    const amountOutBN = await getAmountsOutBN(
        trade.tradeSizes.pool0.token0.sizeBN,
        trade.target.reserveInBN,
        trade.target.reserveOutBN,
    );
    const amountInBN = await getAmountsInBN(
        trade.tradeSizes.pool0.token0.sizeBN,
        trade.target.reserveOutBN,
        trade.target.reserveInBN,
    );

    // CHECKING AMOUNTS AS THEY ARE DIFFERENT FROM WHAT THE CONTRACT RETURNS
    const allAmountsRaw = {
        amountOutEVM:
            fu(await amountOutJS, trade.tokenOut.data.decimals) + trade.tokenOut.data.symbol,
        amountOutBN: amountOutBN.toFixed(trade.tokenOut.data.decimals) + trade.tokenOut.data.symbol,
        amountInEVM:
            fu(await amountInJS, trade.tokenOut.data.decimals) + trade.tokenOut.data.symbol,
        amountInBN: amountInBN.toFixed(trade.tokenOut.data.decimals) + trade.tokenOut.data.symbol,
    };
    return allAmountsRaw;
    // console.log(">>>>>>>>>>>>CHECK AMOUNTS::::::::::::::");
    // console.log(allAmountsRaw);

    // const allAmounts = {
    //     amountOutLocal: fu(trade.quotes.target.token1Out, trade.tokenOut.data.decimals),
    //     amountOutEVM: fu(await amountOutJS[1], trade.tokenOut.data.decimals),
    //     amountOutBN: amountOutBN.toFixed(trade.tokenOut.data.decimals),
    //     amountInLocal: fu(trade.loanPool.amountRepay, trade.tokenIn.data.decimals),
    //     amountInEVM: fu(await amountInJS[0], trade.tokenIn.data.decimals),
    //     amountInBN: amountInBN.toFixed(trade.tokenIn.data.decimals),
    // // };
    // logger.info(">>>>>>>>>>>>CHECK AMOUNTSOUT::::::::::::::");
    // // logger.info(allAmounts);
    // return allAmounts;
}
