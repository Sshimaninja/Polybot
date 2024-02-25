import { K } from "../../../../constants/interfaces";
import { AmountConverter } from "../../classes/AmountConverter";
import { BN2BigInt } from "../../../modules/convertBN";
import { getAmountsInJS } from "../getAmounts/getAmountsIOLocal";

/**
 * This doc calculates whether will revert due to uniswak K being positive or negative
 * Uni V2 price formula: X * Y = K
 * @param
 * @returns Uniswap K before and after  and whether it is positive or negative
 */

export async function getK(
    type: string,
    tradeSize: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    calc: AmountConverter,
): Promise<K> {
    let kalc = {
        uniswapKPre: 0n,
        uniswapKPost: 0n,
        uniswapKPositive: false,
    };
    const tradeSizewithFee = await calc.addFee(tradeSize);
    const newReserveIn = reserveIn * 1000n - tradeSize * 1000n;
    // console.log("newReserveIn: ", newReserveIn.toString())
    if (newReserveIn < 0n) {
        return kalc;
    }

    const tradeSizeInTokenOut = await getAmountsInJS(tradeSize, reserveOut, reserveIn);

    // const tokenOutPrice = BN2BigInt(calc.price.priceOutBN, calc.token1.decimals);
    // // console.log("TradeSize: " + tradeSize.toString() + " * tokenOutPrice: " + tokenOutPrice.toString() + " = " + tokenOutPrice*(tradeSize).toString())
    // const tradeSizeInTermsOfTokenOut = tradeSize*(tokenOutPrice);
    // // console.log('tradeSizeInTermsOfTokenOut: ', tradeSizeInTermsOfTokenOut.toString())
    // const tradeSizeInTermsOfTokenOutWithFee = await calc.addFee(tradeSizeInTermsOfTokenOut);
    // // console.log('tradeSizeInTermsOfTokenOutWithFee: ', tradeSizeInTermsOfTokenOutWithFee.toString())

    kalc =
        type === "multi"
            ? {
                  uniswapKPre: reserveIn * reserveOut,
                  // 1000 * 2000 = 2000000
                  uniswapKPost: (reserveIn - tradeSize) * (reserveOut + tradeSizeInTokenOut),
                  // 200000 = 1800 * 110
                  //subtract loan:
                  // multiply new reserveIn by new reservesOut by adding tradeSizeInTermsOfTokenOut
                  uniswapKPositive: false,
              }
            : {
                  uniswapKPre: reserveIn * reserveOut,
                  uniswapKPost: reserveIn + tradeSizewithFee * reserveOut,
                  // reserveIn + tradeSizewithFee * reserveOut(unchanged)
                  uniswapKPositive: false,
              };
    kalc.uniswapKPositive = kalc.uniswapKPre < kalc.uniswapKPost ? true : false;
    return kalc;
}
