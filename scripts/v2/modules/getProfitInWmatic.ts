import { ethers, Contract } from "ethers";
import { BoolTrade, WmaticProfit } from "../../../constants/interfaces";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { getAmountsOut } from "./getAmountsIOJS";
import {
    gasTokens,
    GasToken,
    uniswapV2Factory,
    uniswapV2Router,
    FactoryMap,
} from "../../../constants/addresses";
import { wallet, provider } from "../../../constants/provider";
import { logger } from "../../../constants/logger";
// import { getGasPoolForTrade } from "./getGasPool";
// import { getWmaticRate } from "./getWmaticRate";
// import { zero } from "../../../constants/environment";
import { fu, pu } from "../../modules/convertBN";
/**
 * @description
 * This function returns the profit in wmatic for a given trade.
 * @param trade
 * @returns wmaticProfit{profitInWMATIC: bigint, gasPool: Contract}
 */

export async function getProfitInWMATIC(trade: BoolTrade): Promise<WmaticProfit> {
    const wmatic: string = gasTokens.WMATIC;
    let wmaticProfit: WmaticProfit;
    let exchanges = Object.values(uniswapV2Factory);
    let exchangesChecked: string[] = [];

    // let profitInWMATIC: bigint;
    // let gasRouter: Contract;
    // let gasPool: Contract;`1

    // IF EITHER TOKENIN OR TOKENOUT IS WMATIC, RETURN THE PROFIT IN WMATIC.
    if (trade.tokenOut.id == wmatic) {
        logger.info("[getProfitInWmatic]: tokenOut is WMATIC");
        let profitInWMATIC = trade.tokenProfit;
        let gasRouter = trade.target.router;
        let gasPool = trade.target.pool;
        wmaticProfit = { profitInWMATIC, gasRouter, gasPool };
        logger.info(
            "[getProfitInWmatic]: profitInWMATIC: " +
                fu(profitInWMATIC, 18) +
                " gasRouter: " +
                (await gasRouter.getAddress()) +
                " gasPool: " +
                (await gasPool.getAddress()),
        );
        return wmaticProfit;
    }

    if (trade.tokenIn.id == wmatic) {
        console.log("[getprofitInWMATIC]: tokenIn is WMATIC");
        let inMatic = await trade.loanPool.router.getAmountsOut(trade.tokenProfit, [
            trade.tokenOut.id,
            wmatic,
        ]);
        let profitInWMATIC = inMatic[1];
        let gasRouter = trade.loanPool.router;
        let gasPool = trade.target.pool;
        wmaticProfit = { profitInWMATIC, gasRouter, gasPool };
        logger.info(
            "[getProfitInWmatic]: profitInWMATIC: " +
                fu(profitInWMATIC, 18) +
                " gasRouter: " +
                (await gasRouter.getAddress()) +
                " gasPool: " +
                (await gasPool.getAddress()),
        );
        return wmaticProfit;
    }

    console.log(
        "[getProfitInWmatic]: tokenIn and tokenOut are not WMATIC: " +
            trade.tokenIn.symbol +
            " " +
            trade.tokenOut.symbol,
        "checking for tokenin/out -> wmatic pool.",
    );

    // IF NEITHER TOKEN IS WMATIC, CHECK FOR A WMATIC POOL ON OTHER EXCHANGES.
    async function findWmaticPool(
        exchange: string,
    ): Promise<{ router: Contract; pool: Contract; pair: any } | undefined> {
        for (let f of exchanges) {
            let factory = new Contract(f, IUniswapV2Factory, provider);

            let pair = {
                pair: await factory.getPair(trade.tokenOut.id, wmatic),
                token: trade.tokenOut.id,
            };
            if (!pair.pair) {
                pair = {
                    pair: await factory.getPair(trade.tokenIn.id, wmatic),
                    token: trade.tokenIn.id,
                };
            }
            if (pair.pair) {
                // find routerID using matching factory key (not property) from uniswapV2Factory:
                let factoryKey = Object.keys(uniswapV2Factory).find(
                    (key) => uniswapV2Factory[key] === f,
                );
                if (!factoryKey) {
                    throw new Error("Factory: " + f + " not found in uniswapV2Factory");
                }
                let routerID = uniswapV2Router[factoryKey];
                console.log(
                    "[getProfitInWmatic]: ticker: ",
                    trade.ticker,
                    " routerID: ",
                    routerID,
                    "factoryKey: ",
                    f,
                    "factory: ",
                    f,
                );
                if (!routerID) {
                    throw new Error("Router not found for factory: " + f);
                }

                let router = new Contract(routerID, IUniswapv2Router02, provider);
                let pool = new Contract(pair.pair, IPair, provider);
                return { router, pool, pair };
            }
        }
        return undefined;
    }

    for (let exchange of exchanges) {
        if (!exchangesChecked.includes(exchange)) {
            const wmaticPool = await findWmaticPool(exchange);
            if (wmaticPool) {
                let amountsOut = await getAmountsOut(wmaticPool.router, trade.tokenProfit, [
                    wmaticPool.pair.token,
                    wmatic,
                ]);
                if (amountsOut === undefined) {
                    logger.error(
                        "AmountsOut not found for trade: " +
                            trade.ticker +
                            " on exchange: " +
                            exchange,
                    );
                    exchangesChecked.push(exchange);
                }
                if (amountsOut === undefined) {
                    let profitInWMATIC = amountsOut[1];
                    let profitStr = fu(profitInWMATIC, 18);
                    let gasRouter = wmaticPool.router;
                    let gasPool = wmaticPool.pool;
                    wmaticProfit = { profitInWMATIC, gasRouter, gasPool };
                    logger.info("gasPool found for trade: ", trade.ticker, "gasRouter: ");
                    logger.info(
                        "[getProfitInWmatic]: profitInWMATIC: " +
                            profitStr +
                            " gasRouter: " +
                            (await gasRouter.getAddress()) +
                            " gasPool: " +
                            (await gasPool.getAddress()),
                    );
                    if (amountsOut[1] > pu("0.1", 18)) {
                        return wmaticProfit;
                    }
                }
            }
            console.log("Searching for gasPool using gasTokens (getGasPoolForTrade)...");

            // IF NO WMATIC POOL IS FOUND, CHECK FOR A GASPOOL.
            exchanges.find(async (f) => {
                for (let address of Object.keys(gasTokens)) {
                    if (address == trade.tokenIn.id || address == trade.tokenOut.id) {
                        let factory = new Contract(f, IUniswapV2Factory, provider);
                        let pair = {
                            pair: await factory.getPair(trade.tokenOut.id, address),
                            token: trade.tokenOut.id,
                        };
                        if (!pair) {
                            pair = {
                                pair: await factory.getPair(trade.tokenIn.id, address),
                                token: trade.tokenIn.id,
                            };
                        }
                        if (pair) {
                            let routerID = Object.keys(uniswapV2Router).find(
                                (key) => uniswapV2Router[key] === f,
                            );
                            if (!routerID) {
                                throw new Error("Router not found for factory: " + f);
                            }
                            let router = new Contract(routerID, IUniswapv2Router02, provider);
                            let pool = new Contract(pair.pair, IPair, provider);
                            let amountsOut = await getAmountsOut(router, trade.tokenProfit, [
                                pair.token,
                                address,
                                wmatic,
                            ]);
                            let profitInWMATIC = amountsOut[2];
                            let gasRouter = router;
                            let gasPool = pool;
                            wmaticProfit = { profitInWMATIC, gasRouter, gasPool };
                            logger.info(
                                "[getProfitInWmatic]: profitInWMATIC: " +
                                    fu(profitInWMATIC, 18) +
                                    " gasRouter: " +
                                    (await gasRouter.getAddress()) +
                                    " gasPool: " +
                                    (await gasPool.getAddress()),
                            );
                            if (amountsOut[1] > pu("0.1", 18)) {
                                return wmaticProfit;
                            }
                        }
                    }
                }
            });
        }
    }
    console.log(
        "Token has no value in WMATIC: ",
        trade.ticker,
        trade.loanPool.exchange,
        trade.target.exchange,
        trade.tokenProfit,
    );
    wmaticProfit = {
        profitInWMATIC: 0n,
        gasRouter: trade.loanPool.router,
        gasPool: trade.target.pool,
    };
    return wmaticProfit;
}

// export type RouterMap = { [protocol: string]: string };

// export const uniswapV2Router: RouterMap = {
//     SUSHI: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
//     QUICK: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
//     APE: "0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607",
//     JET: "0x5C6EC38fb0e2609672BDf628B1fD605A523E5923",
//     POLYDEX: "0xBd13225f0a45BEad8510267B4D6a7c78146Be459",
//     MMF: "0x51aba405de2b25e5506dea32a6697f450ceb1a17",
//     CAT: "0x94930a328162957FF1dd48900aF67B5439336cBD",
// };
// // GAS TOKENS:

// export type GasToken = { [gasToken: string]: string };

// export const gasTokens: GasToken = {
//     WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
//     ETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
//     WETH: "0x95D7632E9f183b47FCe7BD3518bDBf3E35e25eEF",
//     USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
//     USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
//     DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
//     WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
// };

// export type FactoryMap = { [protocol: string]: string };

// export const uniswapV2Factory: FactoryMap = {
//     QUICK: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
//     SUSHI: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
//     APE: "0xCf083Be4164828f00cAE704EC15a36D711491284",
//     JET: "0x668ad0ed2622C62E24f0d5ab6B6Ac1b9D2cD4AC7",
//     POLYDEX: "0x5BdD1CD910e3307582F213b33699e676E61deaD9",
//     MMF: "0x7cFB780010e9C861e03bCbC7AC12E013137D47A5",
//     CAT: "0x477Ce834Ae6b7aB003cCe4BC4d8697763FF456FA",
// };
