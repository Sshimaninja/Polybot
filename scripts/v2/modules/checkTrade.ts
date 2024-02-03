import { BoolTrade } from "../../../constants/interfaces";
/**
 *
 * @param trade
 * @description
 * Similar to uniswapv2pair check, but we only need to check the output amount, as the input will only increase after the trade:
 *  uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
 *  require(amount0In > 0 || amount1In > 0, ' INSUFFICIENT_INPUT_AMOUNT');
 */
export async function checkTrade(trade: BoolTrade) {
    const balance0 = trade.target.reserveIn + trade.target.tradeSize;
    const balance1 = trade.target.reserveOut - trade.target.amountOut;

    const finalBalance0 = balance0 > trade.target.reserveIn ? balance0 : 0;
    const finalBalance1 =
        balance1 > trade.target.reserveOut - trade.target.amountOut
            ? balance1 - (trade.target.reserveOut - trade.target.amountOut)
            : 0;
    if (finalBalance1 > 0) {
        console.log("Trade is valid");
        console.log("Final balance0:");
        console.log("Final balance1:", finalBalance1);
        return true;
    } else {
        console.log("Trade is invalid: Insufficient final balance");
        return false;
    }
}
