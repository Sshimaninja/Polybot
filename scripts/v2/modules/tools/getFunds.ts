import { ethers } from "ethers";
import { abi as IERC20 } from "@uniswap/v2-periphery/build/IERC20.json";
import { provider, signer } from "../../../../constants/provider";
import { BigNumber as BN } from "bignumber.js";
import { BoolTrade, Size } from "../../../../constants/interfaces";
import { BigInt2BN } from "../../../modules/convertBN";

export async function getFunds(trade: BoolTrade): Promise<Size> {
    const tokenInContract = new ethers.Contract(trade.tokenIn.id, IERC20, provider);
    const balance = trade.wallet.tokenInBalance;
    const balanceBN = BigInt2BN(balance, trade.tokenIn.decimals);
    let size: Size = {
        size: balance,
        sizeBN: balanceBN,
    };
    return size;
}
