// import {../scripts/v2/modules/getAmounts/getAmountsIOJS
//     getAmountsIn as getAmountsInJS,
//     getAmountsOut as getAmountOutJS,
// } from "../scripts/v2/modules/getAmounts/getAmountsIOJS";
// import {
//     getAmountsIn as getAmountsInBN,
//     getAmountsOut as getAmountsOutBN,
// } from "../scripts/v2/modules/getAmounts/getAmounts/getAmountsIOBN";
// import { getAmountsIn, getAmountsOut } from "../scripts/v2/modules/getAmounts/getAmountsIOLocal";
// import { BoolTrade } from "../constants/interfaces";
// import { BigNumber as BN } from "bignumber.js";
// import { logger } from "../constants/logger";
// import { fu } from "../scripts/modules/convertBN";

// export async function debugAmounts(trade: BoolTrade) {
//     const amountOutJS = await getAmountOutJS(trade.target.router, trade.target.tradeSize.size, [
//         trade.tokenIn.id,
//         trade.tokenOut.id,
//     ]);
//     const amountInJS = await getAmountsInJS(trade.loanPool.router, trade.quotes.target.flashOut, [
//         trade.tokenIn.id,
//         trade.tokenOut.id,
//     ]);
//     const amountOutBN = await getAmountsOutBN(
//         trade.target.tradeSize.sizeBN,
//         BN(fu(trade.target.reserveIn, trade.tokenIn.decimals)),
//         BN(fu(trade.target.reserveOut, trade.tokenOut.decimals)),
//     );
//     const amountInBN = await getAmountsInBN(
//         trade.target.tradeSize.sizeBN,
//         BN(fu(trade.target.reserveIn, trade.tokenIn.decimals)),
//         BN(fu(trade.target.reserveOut, trade.tokenOut.decimals)),
//     );

//     // CHECKING AMOUNTS AS THEY ARE DIFFERENT FROM WHAT THE CONTRACT RETURNS
//     const allAmounts = {
//         amountOutLocal: fu(trade.quotes.target.flashOut, trade.tokenOut.decimals),
//         amountOutEVM: fu(amountOutJS[1], trade.tokenOut.decimals),
//         amountOutBN: amountOutBN.toFixed(trade.tokenOut.decimals),
//         amountInLocal: fu(trade.loanPool.amountRepay, trade.tokenIn.decimals),
//         amountInEVM: fu(amountInJS[0], trade.tokenIn.decimals),
//         amountInBN: amountInBN.toFixed(trade.tokenIn.decimals),
//     };
//     logger.info(">>>>>>>>>>>>CHECK AMOUNTSOUT::::::::::::::");
//     // logger.info(allAmounts);
//     return allAmounts;
// }
