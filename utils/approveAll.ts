import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { FactoryPair, TradePair } from "../constants/interfaces";
import { signer } from "../constants/provider";
import { swapSingleID } from "../constants/environment";
import { swap } from "../test/testFunds";

export async function approve(token: string, spender: string, maxInt: bigint): Promise<bigint> {
    const tokenContract = new ethers.Contract(token, IERC20, signer);
    const ownerAddress = await signer.getAddress();
    const allowance: bigint = await tokenContract.allowance(ownerAddress, spender);
    // const maxInt = ethers.MaxInt256;
    try {
        if (allowance == 0n) {
            const approvalTx = await tokenContract.approve(spender, maxInt);
            const tx = await signer.populateTransaction(approvalTx);
            const response = await signer.sendTransaction(tx);
            await response.wait();
            // tokenContract.on("Approval", (owner, spender, amount) => {
            //     console.log("Approval event: ", owner, spender, amount, event);
            // });
            const tokenAllowance = await tokenContract.allowance(ownerAddress, spender);
            console.log("Token allowance: ", tokenAllowance);
        }
    } catch (error: any) {
        console.error(`Error in token approval for ${token}:`, error.message);
        throw error;
    }
    return allowance;
}

async function approveAll() {
    const message = `Approving tokens for trade: ${Date.now()}`;

    let matchDir = path.join(__dirname, "../data/matches/v2/");

    async function dataFeed() {
        const pairList: FactoryPair[] = [];
        const files = await fs.promises.readdir(matchDir);
        for (const file of files) {
            const filePath = path.join(matchDir, file);
            const data = await fs.promises.readFile(filePath, "utf8");
            try {
                const pairs = JSON.parse(data);
                pairList.push(pairs);
            } catch (error) {
                console.error(`Error parsing file ${filePath}:`, error);
                console.error("Data:", data);
            }
        }
        return pairList;
    }

    const pairList: FactoryPair[] = (await dataFeed()).flat();
    for (const pair of pairList) {
        console.log("Approving tokens for trade: ");
        console.log(pair.exchangeA, pair.exchangeB);
        let maxInt = ethers.MaxInt256;
        let swapIn: bigint = 0n;
        let swapOut: bigint = 0n;
        let routeIn: bigint = 0n;
        let routeOut: bigint = 0n;
        for (const match of pair.matches) {
            try {
                // console.log(match);
                if (match.token0.id == "QUICK") {
                    maxInt = 2n ** 96n - 1n;
                    console.log("Approving tokens for swapSingle: ", match.ticker);

                    swapIn = await approve(match.token0.id, swapSingleID, maxInt);
                    swapOut = await approve(match.token1.id, swapSingleID, maxInt);
                    console.log("Approving tokens for target router: ", match.ticker);

                    routeIn = await approve(match.token0.id, pair.routerA_id, maxInt);
                    routeOut = await approve(match.token1.id, pair.routerA_id, maxInt);
                } else {
                    swapIn = await approve(match.token0.id, swapSingleID, maxInt);
                    swapOut = await approve(match.token1.id, swapSingleID, maxInt);
                    routeIn = await approve(match.token0.id, pair.routerA_id, maxInt);
                    routeOut = await approve(match.token1.id, pair.routerA_id, maxInt);
                }
                const a = {
                    swapIn: swapIn,
                    swapOut: swapOut,
                    routeIn: routeIn,
                    routeOut: routeOut,
                };
                console.log("Approved: ", a);
            } catch (error: any) {
                if (error.reason && error.reason.includes("amount exceeds")) {
                    console.log("Error in token approval: ", error.reason);
                }
            }
        }
    }
}
approveAll();
