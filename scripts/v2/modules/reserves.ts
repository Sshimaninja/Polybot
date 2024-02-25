import { ethers } from "ethers";
import { BigNumber as BN } from "bignumber.js";
import { logger } from "../../../constants/logger";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
// import { abi as IPool } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { wallet, provider } from "../../../constants/provider";
import { ReservesData, Pair, TradePair } from "../../../constants/interfaces";
import { BigInt2BN, fu } from "../../modules/convertBN";
/**
 * @description
 * This class returns an array of an array of reserves for an array of pairs.
 */
export class Reserves {
    static reserves: ReservesData[] = [];

    constructor(match: TradePair) {
        this.getReserves(match);
    }

    async getPoolIDs(pair: TradePair): Promise<string[]> {
        const poolIDs: string[] = [];
        for (const key in pair) {
            if (key.startsWith("pool")) {
                const poolID = pair[key as keyof TradePair];
                if (typeof poolID === "string") {
                    poolIDs.push(poolID);
                }
            }
        }
        return poolIDs;
    }
    async getReserves(match: TradePair): Promise<ReservesData[]> {
        const poolIDs = await this.getPoolIDs(match);
        const reserves: ReservesData[] = [];
        for (const poolID of poolIDs) {
            let Pair = new ethers.Contract(poolID, IPair, provider);
            if ((await Pair.getAddress()) != "0x0000000000000000000000000000000000000000") {
                try {
                    let reservesData = await Pair.getReserves();
                    if (reservesData === undefined) {
                        return reserves;
                    }
                    const [reserveOut, reserveIn, blockTimestampLast] = reservesData;
                    const reserveInBN = BigInt2BN(reserveIn, match.token1.decimals);
                    const reserveOutBN = BigInt2BN(reserveOut, match.token0.decimals);
                    const reserveData: ReservesData = {
                        reserveIn,
                        reserveOut,
                        reserveInBN,
                        reserveOutBN,
                        blockTimestampLast,
                    };
                    reserves.push(reserveData);
                    // console.log("reserveData::::::::::::::::::::::::::::")
                    // console.log(reserveData)
                } catch (error: any) {
                    console.error("Error (getReserves(" + poolID + ")): " + error);
                    // logger.error(error)
                    return reserves;
                }
            } else {
                console.log("Pair" + poolID + " no longer exists!");
                return reserves;
            }
        }
        return reserves;
    }
}
