import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { FactoryPair, TradePair } from "../../../../constants/interfaces";
import { signer } from "../../../../constants/provider";
import { swapSingleID } from "../../../../constants/environment";
import { swap } from "../../../../test/testFunds";
import { gasTokens } from "../../../../constants/addresses";
import { approve } from "./approve";

export async function approveGasTokens() {
    for (let token in gasTokens) {
        // console.log("Approving gasTokens for trade: ", token);
        let tokenID = gasTokens[token];
        let maxInt = ethers.MaxInt256;
        // let swapIn: bigint = 0n;
        // let routeIn: bigint = 0n;
        try {
            let gasTokenAllowance = await approve(tokenID, swapSingleID, maxInt);
            const a = {
                ticker: token,
                gasTokenAllowance: gasTokenAllowance,
            };
            console.log("Approved: ", a);
        } catch (error: any) {
            if (error.reason && error.reason.includes("amount exceeds")) {
                console.log("Error in token approval: ", error.reason);
            } else {
                console.error(`Error in token approval for ${token}:`, error.message);
            }
        }
    }
}

approveGasTokens();
