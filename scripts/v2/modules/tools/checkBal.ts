import { Contract, ethers } from "ethers";
import { provider, signer } from "../../../../constants/provider";
import { deployedMap, gasTokens, uniswapV2Factory } from "../../../../constants/addresses";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IERC20 } from "@uniswap/v2-periphery/build/IERC20.json";
import { fu } from "../../../modules/convertBN";
import { Token } from "../../../../constants/interfaces";
require("dotenv").config();
/**
 * checks gas token balance of the flashwallet
 * @param token0
 * @param token0dec
 * @param token1
 * @param token1dec
 */

interface bal {
    walletID: string;
    token0: bigint;
    token1: bigint;
    gas: bigint;
}

export async function checkBal(token0: Token, token1: Token): Promise<bal> {
    const t0 = new ethers.Contract(token0.id, IERC20, provider);
    const t1 = new ethers.Contract(token1.id, IERC20, provider);
    const wmatictoken = new ethers.Contract(gasTokens.WMATIC, IERC20, provider);
    const wallet = await signer.getAddress();
    const walletbalance0 = await t0.balanceOf(wallet);
    const walletbalance1 = await t1.balanceOf(wallet);
    const walletbalanceMatic = await wmatictoken.balanceOf(wallet);

    // console.log("Wallet balance: ");
    // console.log("Wallet: " + (await signer.getAddress()));
    // console.log(
    //     "Wallet balance token0: " +
    //         fu(walletbalance0, token0.decimals) +
    //         " Asset:  " +
    //         token0.symbol,
    // );
    // console.log(
    //     "Wallet balance token1: " +
    //         fu(walletbalance1, token1.decimals) +
    //         " Asset:  " +
    //         token1.symbol,
    // );
    // console.log("Wallet Balance Matic: " + fu(walletbalanceMatic, 18) + " " + "MATIC");
    // console.log("Block Number: " + (await provider.getBlockNumber()))
    // console.log("Contract balance: " + contractbalance.toString() + " " + deployedMap.flashTest)
    return {
        walletID: await signer.getAddress(),
        token0: walletbalance0,
        token1: walletbalance1,
        gas: walletbalanceMatic,
    };
}
// checkBal("0x2791bca1f2de4661ed88a30c99a7a9449aa84174", 6, "0x67eb41a14c0fe5cd701fc9d5a3d6597a72f641a6", 18);

export async function checkGasBal(): Promise<bigint> {
    const wmatictoken = new ethers.Contract(
        "0x0000000000000000000000000000000000001010",
        IERC20,
        provider,
    );
    const walletbalanceMatic = await wmatictoken.balanceOf(await signer.getAddress());
    // console.log("Wallet Balance Matic: " + fu(walletbalanceMatic, 18) + " " + "MATIC")
    return walletbalanceMatic;
}
