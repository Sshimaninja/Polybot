import { Contract, ethers } from "ethers";
import { provider, signer } from "../../../../constants/provider";
import { deployedMap, gasTokens, uniswapV2Factory } from "../../../../constants/addresses";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IERC20 } from "@uniswap/v2-periphery/build/IERC20.json";
import { fu } from "../../../modules/convertBN";
import { Token } from "../../../../constants/interfaces";
import { logger } from "../../../../constants/logger";
import { MATIC } from "../../../../constants/environment";
import { Trade } from "../../Trade";
require("dotenv").config();
/**
 * checks gas token balance of the flashwallet
 * @param tokenIn
 * @param tokenIndec
 * @param tokenOut
 * @param tokenOutdec
 */

interface bal {
    walletID: string;
    tokenIn: bigint;
    tokenOut: bigint;
    gas: bigint;
}

export async function walletBal(tokenIn: Token, tokenOut: Token): Promise<bal> {
    const t0 = new ethers.Contract(tokenIn.id, IERC20, provider);
    const t1 = new ethers.Contract(tokenOut.id, IERC20, provider);
    const matictoken = new ethers.Contract(await MATIC.getAddress(), IERC20, provider);
    const wallet = await signer.getAddress();
    const walletbalance0 = await t0.balanceOf(wallet);
    const walletbalance1 = await t1.balanceOf(wallet);
    const walletbalanceMatic = await matictoken.balanceOf(wallet);

    return {
        walletID: await signer.getAddress(),
        tokenIn: walletbalance0,
        tokenOut: walletbalance1,
        gas: walletbalanceMatic,
    };
}
// walletBal("0x2791bca1f2de4661ed88a30c99a7a9449aa84174", 6, "0x67eb41a14c0fe5cd701fc9d5a3d6597a72f641a6", 18);

export async function checkGasBal(): Promise<bigint> {
    const matictoken = new ethers.Contract(
        "0x0000000000000000000000000000000000001010",
        IERC20,
        provider,
    );
    const walletbalanceMatic = await matictoken.balanceOf(await signer.getAddress());
    // console.log("Wallet Balance Matic: " + fu(walletbalanceMatic, 18) + " " + "MATIC")
    return walletbalanceMatic;
}
