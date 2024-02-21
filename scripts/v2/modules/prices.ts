import { BigNumber as BN } from "bignumber.js";
import { Pair, ReservesData } from "../../../constants/interfaces";
/**
 * @description
 * This class holds an array of prices for a given pair, using reserves.
 */

export class Prices {
    poolID: string;
    priceIn: bigint;
    priceOut: bigint;
    priceInBN: BN;
    priceOutBN: BN;
    reserves: ReservesData;
    constructor(poolID: string, reserves: ReservesData) {
        if (!reserves) {
            throw new Error("Reserves is undefined");
        }
        this.poolID = poolID;
        this.reserves = reserves;
        reserves.reserveIn = reserves.reserveIn;
        reserves.reserveOut = reserves.reserveOut;
        this.priceIn = reserves.reserveIn / reserves.reserveOut;
        this.priceOut = reserves.reserveOut / reserves.reserveIn;
        this.priceInBN = reserves.reserveInBN.div(reserves.reserveOutBN);
        this.priceOutBN = reserves.reserveOutBN.div(reserves.reserveInBN);
    }
}
