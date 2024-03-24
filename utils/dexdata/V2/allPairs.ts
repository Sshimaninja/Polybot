import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IFactory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IERC20 } from "@uniswap/v2-core/build/IERC20.json";
import { Contract } from "ethers";
import { fu } from "../../../scripts/modules/convertBN";
import {
    FactoryMap,
    RouterMap,
    uniswapV2Factory,
    uniswapV3Factory,
} from "../../../constants/addresses";
import { provider } from "../../../constants/provider";
import fs from "fs";
import path from "path";

/* 

A class which calls allPairs on each factory in the factoryMap and returns an array of all pairs by factory.
Then compares tokens in each pair and returns an object of matching pairs.

TODO: UPDATE this so that it outputs SmartPool objects to the file, instead of the current loose format.
Either that or update the flashit/swap functions to accept this format instead (which is built to make a smaller database, so might be best.)

*/
export class AllV2Pairs {
    factoryMap: FactoryMap;
    routerMap: RouterMap;

    constructor(factoryMap: FactoryMap, routerMap: RouterMap) {
        this.factoryMap = factoryMap;
        this.routerMap = routerMap;
    }

    async getPairs(): Promise<any> {
        // Object.keys(this.factoryMap).forEach(async (factory) => {
        for (const factory of Object.keys(this.factoryMap)) {
            console.log("Starting");
            const factoryID = this.factoryMap[factory];
            const routerID = this.routerMap[factory];
            console.log("FactoryID: " + factoryID);
            const factoryContract = new Contract(factoryID, IFactory, provider);
            if (factoryContract.getAddress() != undefined) {
                console.log(
                    "FactoryContract Initialised: " +
                        factoryContract.getAddress(),
                );
            } else {
                console.log("FactoryContract not initialised");
            }

            async function getAllPairs(factoryContract: Contract) {
                const allPairsLen = await factoryContract.allPairsLength();
                console.log("AllPairsLength: " + factory + `: ` + allPairsLen);
                const pairs: string[] = [];
                await Promise.all(
                    Array.from(
                        { length: Number(allPairsLen) },
                        (_, i) => i,
                    ).map(async (index) => {
                        const allPairs = await factoryContract.allPairs(index);
                        pairs.push(allPairs);
                    }),
                );
                return pairs;
            }
            // const subsetPairs = pairs.flat().slice(0, 30);//TESTING
            // console.log('Pairs: ' + pairs);
            const validPairs: any[] = [];

            async function validatePairs() {
                const pairsFile = `./data/validPairs/V2/${factory}.json`;
                fs.mkdirSync(path.dirname(pairsFile), { recursive: true });
                const pairs = await getAllPairs(factoryContract);
                for (const pair of pairs) {
                    const pairContract = new Contract(pair, IPair, provider);
                    // console.log('PairContract: ' + pairContract.getAddress());
                    try {
                        const reserves = await pairContract.getReserves();
                        // console.log(reserves);
                        const blockTimeStampLast = reserves[2];
                        const currentBlockNumber =
                            await provider.getBlockNumber();
                        const currentBlock = await provider.getBlock(
                            currentBlockNumber,
                        );
                        if (currentBlock == undefined) {
                            console.log("Current block is undefined");
                            return;
                        }
                        const currentBlockTimestamp = currentBlock.timestamp;
                        const block = currentBlockTimestamp;
                        // console.log('Block: ' + block);

                        if (
                            reserves[0] > 1n &&
                            reserves[1] > 1n &&
                            blockTimeStampLast > block - 40000 * 12
                        ) {
                            const token0id = await pairContract.token0();
                            const token0 = new Contract(
                                token0id,
                                IERC20,
                                provider,
                            );

                            const token1id = await pairContract.token1();
                            const token1 = new Contract(
                                token1id,
                                IERC20,
                                provider,
                            );

                            const token0Symbol = await token0.symbol();
                            const token0Decimals = await token0.decimals();
                            const token1Symbol = await token1.symbol();
                            const token1Decimals = await token1.decimals();
                            const ticker = `${token0Symbol}/${token1Symbol}`;
                            console.log("Pair: " + pair);
                            console.log("Last: " + blockTimeStampLast);
                            console.log("Current: " + currentBlockTimestamp);
                            console.log("Symbol: " + ticker);
                            console.log("Token0: " + token0id);
                            console.log(
                                "reserves0: " + fu(reserves[0], token0Decimals),
                            );
                            console.log("Token1: " + token1id);
                            console.log(
                                "reserves1: " + fu(reserves[1], token1Decimals),
                            );
                            const tokenData = {
                                ticker: ticker,
                                poolID: pair,
                                token0: {
                                    symbol: token0Symbol,
                                    id: token0.getAddress(),
                                    decimals: token0Decimals.toString(),
                                },
                                token1: {
                                    symbol: token1Symbol,
                                    id: token1.getAddress(),
                                    decimals: token1Decimals.toString(),
                                },
                            };
                            validPairs.push(tokenData);
                        }
                    } catch (e) {
                        console.log(
                            `Error getting token data for pair ${pair}: ${e}\n skipping...`,
                        );
                    }
                    const factoryPair = [
                        {
                            exchange: factory,
                            factoryID: factoryID,
                            routerID: routerID,
                            pairs: validPairs,
                        },
                    ];
                    fs.writeFileSync(
                        pairsFile,
                        JSON.stringify(factoryPair, null, 2) + "\n",
                    );
                    console.log(`Valid pairs: ${validPairs.length}`);
                    console.log(`Valid pairs written to ${pairsFile}`);
                }
            }
            await validatePairs();
        }
    }
}
