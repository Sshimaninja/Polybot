import { ethers } from "ethers";
import { abi as IERC20 } from "@uniswap/v2-periphery/build/IERC20.json";
import { provider, signer } from "../../../../constants/provider";
import { BigNumber as BN } from "bignumber.js";
import { BoolTrade, Size } from "../../../../constants/interfaces";
import { BigInt2BN } from "../../../modules/convertBN";

export async function getFunds(trade: BoolTrade): Promise<Size> {
    const tokenInContract = new ethers.Contract(trade.tokenIn.data.id, IERC20, provider);
    const balance0 = trade.wallet.tokenInBalance;
    const balance1 = trade.wallet.tokenOutBalance;
    const balance0BN = BigInt2BN(balance0, trade.tokenIn.data.decimals);
    const balance1BN = BigInt2BN(balance1, trade.tokenOut.data.decimals);
    let size: Size = {
        token0: { size: balance0, sizeBN: balance0BN },
        token1: { size: balance1, sizeBN: balance1BN },
    };
    return size;
}
