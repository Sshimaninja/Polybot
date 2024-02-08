import {
    getAmountsIn as getAmountsInJS,
    getAmountsOut as getAmountOutJS,
} from "../v2/modules/getAmountsIOJS";
import {
    getAmountsIn as getAmountsInBN,
    getAmountsOut as getAmountsOutBN,
} from "../v2/modules/getAmountsIOBN";
import { getAmountsIn, getAmountsOut } from "../v2/modules/getAmountsIOLocal";
import { BoolTrade } from "../../constants/interfaces";
import { BigNumber as BN } from "bignumber.js";
import { logger } from "../../constants/logger";
import { fu } from "../modules/convertBN";

export async function debugAmounts(trade: BoolTrade) {
    const amountOutJS = await getAmountOutJS(trade.target.router, trade.target.tradeSize, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);
    const amountInJS = await getAmountsInJS(trade.loanPool.router, trade.target.amountOut, [
        trade.tokenIn.id,
        trade.tokenOut.id,
    ]);
    const amountOutBN = await getAmountsOutBN(
        BN(fu(trade.target.tradeSize, trade.tokenIn.decimals)),
        BN(fu(trade.target.reserveIn, trade.tokenIn.decimals)),
        BN(fu(trade.target.reserveOut, trade.tokenOut.decimals)),
    );
    const amountInBN = await getAmountsInBN(
        BN(fu(trade.target.tradeSize, trade.tokenIn.decimals)),
        BN(fu(trade.target.reserveIn, trade.tokenIn.decimals)),
        BN(fu(trade.target.reserveOut, trade.tokenOut.decimals)),
    );

    // CHECKING AMOUNTS AS THEY ARE DIFFERENT FROM WHAT THE CONTRACT RETURNS
    const allAmounts = {
        amountOutLocal: fu(trade.target.amountOut, trade.tokenOut.decimals),
        amountOutEVM: fu(amountOutJS[1], trade.tokenOut.decimals),
        amountOutBN: amountOutBN.toFixed(trade.tokenOut.decimals),
        amountInLocal: fu(trade.loanPool.amountRepay, trade.tokenIn.decimals),
        amountInEVM: fu(amountInJS[0], trade.tokenIn.decimals),
        amountInBN: amountInBN.toFixed(trade.tokenIn.decimals),
    };
    logger.info(">>>>>>>>>>>>CHECK AMOUNTSOUT::::::::::::::");
    // logger.info(allAmounts);
    return allAmounts;
}
