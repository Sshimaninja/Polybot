// import {  utils as u } from 'ethers'
import { BigNumber as BN } from "bignumber.js";
/**
 * Converts BigInt to bignumber.js BigInt and vice versa.
 */

// export const fu = fu
// export const pu = u.parseUnits

export function fbi(bigint: bigint, decimals: number): string {
    let str = bigint.toString();
    if (str.length <= decimals) {
        // Pad with zeros if necessary
        str = str.padStart(decimals + 1, "0");
    }
    const index = str.length - decimals;
    return str.slice(0, index) + "." + str.slice(index);
}

export function fu(value: bigint, decimals: number): string {
    let divisor = BigInt(Math.pow(10, decimals));
    let integerPart = Number(value / divisor);
    let decimalPart = Number(value % divisor);
    return `${integerPart}.${decimalPart}`;
}

export function pu(bn: string, decimals: number): bigint {
    try {
        const [whole, fraction = ""] = bn.split(".");
        const base = BigInt(10) ** BigInt(decimals);
        return BigInt(whole) * base + (fraction ? BigInt(fraction.padEnd(decimals, "0")) : 0n);
    } catch (error: any) {
        console.log("convertBN: pu: ", error.message);
        return 0n;
    }
}

export function BigInt2BN(bn: bigint, decimals: number): BN {
    try {
        if (bn === undefined || decimals === undefined) {
            throw new Error("bn or decimals is undefined");
        }

        const result = BN(bn.toString()).dividedBy(BN(10).pow(decimals));
        // console.log('convertBN: bigint2BN: ', result.toString());
        // console.log(result)
        return result;
    } catch (error: any) {
        console.log("convertBN: bigint2BN: ", error.message);
        return new BN(0);
    }
}

export function BN2BigInt(bn: BN, decimals: number): bigint {
    try {
        return pu(bn.toFixed(decimals), decimals);
    } catch (error: any) {
        console.log("convertBN: bigint2BN: bn is undefined");
        return 0n;
    }
}

export function BigInt2String(bn: bigint, decimals: number): string {
    try {
        return (bn ** BigInt(decimals)).toString();
    } catch (error: any) {
        console.log("convertBN: bigint2BN: bn is undefined");
        return BN(0).toString();
    }
}

export function BNtoString(bn: BN, decimals: number): string {
    try {
        return bn.toFixed(decimals);
    } catch (error: any) {
        console.log("convertBN: bigint2BN: bn is undefined");
        return BN(0).toString();
    }
}
