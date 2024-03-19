import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { FactoryPair, TradePair } from "../../../constants/interfaces";
import { signer } from "../../../constants/provider";
import { swapSingleID } from "../../../constants/environment";
import { swap } from "../../../test/testFunds";
import {
    gasTokens,
    uniswapV2Router as router,
} from "../../../constants/addresses";
import { approve } from "./transaction/approve";

export async function approveRouters() {
    for (let id in router) {
        let routerID = router[id];
        for (let token in gasTokens) {
            let tokenID = gasTokens[token];
            let maxInt = ethers.MaxInt256;
            try {
                let gasTokenAllowanceRouterContract = await approve(
                    tokenID,
                    routerID,
                    maxInt,
                );
                const a = {
                    router: id,
                    allowanceRouterContract: gasTokenAllowanceRouterContract,
                };
                console.log("Approved: ", a);
            } catch (error: any) {
                if (error.reason && error.reason.includes("amount exceeds")) {
                    console.log("Error in gasToken approval: ", error.reason);
                } else {
                    console.error(
                        `Error in gasToken approval for ${id}:`,
                        error.message,
                    );
                }
            }
        }
    }
}

approveRouters();
