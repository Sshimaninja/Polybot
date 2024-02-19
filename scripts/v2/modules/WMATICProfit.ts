import { ethers, Contract } from "ethers";
import { BoolTrade /*WmaticProfit*/ } from "../../../constants/interfaces";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { getAmountsOut } from "./getAmountsIOJS";
import {
    // gasTokens,
    GasToken,
    uniswapV2Factory,
    uniswapV2Router,
    FactoryMap,
    RouterMap,
    ExchangeMap,
} from "../../../constants/addresses";
import { wallet, provider } from "../../../constants/provider";
import { logger } from "../../../constants/logger";
// import { getGasPoolForTrade } from "./getGasPool";
// import { getWmaticRate } from "./getWmaticRate";
// import { zero } from "../../../constants/environment";
import { fu, pu } from "../../modules/convertBN";
import { zero, wmatic } from "../../../constants/environment";
import { factories } from "../../../typechain-types";
/**
 * @description
 * This function returns the profit in wmatic for a given trade.
 * @param trade
 * @returns wmaticProfit{profitInWMATIC: bigint, gasPool: Contract}
 */

// TODO: This function is messy/ugly but it works (finally). Refactor into a Class.

///THIS FUNCITON ONLY RETURNS THE POOL, NOT THE ACTUAL PROFIT IN WMATIC. MAKE IT RETURN THE PROFIT OR IT'S USELESS.

/// THAT IS PROBABLY WHY YOU'RE GETTING 0n FOR PROFIT CALCULATIONS.

export class WMATICProfit {
    trade: BoolTrade;
    exchanges: ExchangeMap;
    wmaticID: string;
    profitInWMATIC: bigint;
    gasTokens: GasToken;
    gasRouter: Contract | undefined;
    gasPool: Contract | undefined;
    constructor(trade: BoolTrade, gasTokens: GasToken, exchanges: ExchangeMap) {
        this.gasTokens = gasTokens;
        this.exchanges = exchanges;
        this.trade = trade;
        this.wmaticID = this.gasTokens.WMATIC;
        this.profitInWMATIC = 0n;
        this.gasRouter = trade.loanPool.router;
        this.gasPool = trade.target.pool;
    }

    //  async getProfitInWMATIC(trade: BoolTrade) {
    //     const wmatic: string = this.gasTokens.WMATIC;
    //     let exchanges = Object.values(uniswapV2Factory);
    //     let exchangesChecked: string[] = [];

    //     let profitInWMATIC: bigint;
    //     let gasRouter: Contract;
    //     let gasPool: Contract;

    // IF EITHER TOKENIN OR TOKENOUT IS WMATIC, RETURN THE PROFIT IN WMATIC.

    async getWMATICProfit(): Promise<bigint> {
        let profitInWMATIC: bigint | undefined;
        if (this.trade.tokenIn.id === this.wmaticID) {
            profitInWMATIC = await this.tokenInisWMATIC();
        }
        if (this.trade.tokenOut.id === this.wmaticID) {
            profitInWMATIC = await this.tokenOutisWMATIC();
        }
        if (profitInWMATIC === undefined) {
            profitInWMATIC = await this.scanAllExchangesForWMATIC();
        }
        if (profitInWMATIC === undefined) {
            profitInWMATIC = await this.scanAllExchangesForGasTokens();
        } else if (profitInWMATIC === undefined) {
            console.log(
                "Profit token has no value: ",
                this.trade.ticker,
                "Profit in tokenOut: ",
                fu(this.trade.profits.profitToken, this.trade.tokenOut.decimals),
            );
            profitInWMATIC = 0n;
            return profitInWMATIC;
        }
        return (profitInWMATIC = 0n);
    }

    async tokenOutisWMATIC(): Promise<bigint | undefined> {
        if (this.trade.tokenOut.id == this.wmaticID) {
            logger.info("[getProfitInWmatic]: tokenOut is WMATIC");
            let profitInWMATIC = this.trade.profits.profitToken;
            let gasRouter = this.trade.target.router;
            let gasPool = this.trade.target.pool;
            logger.info(
                "[getProfitInWmatic]: profitInWMATIC: " +
                    fu(profitInWMATIC, 18) +
                    " gasRouter: " +
                    (await gasRouter.getAddress()) +
                    " gasPool: " +
                    (await gasPool.getAddress()),
            );
            return profitInWMATIC;
        }
    }

    async tokenInisWMATIC(): Promise<bigint | undefined> {
        if (this.trade.tokenIn.id == this.wmaticID) {
            console.log("[getprofitInWMATIC]: tokenIn is WMATIC");
            let inMatic = await this.trade.loanPool.router.getAmountsOut(
                this.trade.profits.profitToken,
                [this.trade.tokenOut.id, wmatic],
            );
            let profitInWMATIC = inMatic[1];
            let gasRouter = this.trade.loanPool.router;
            let gasPool = this.trade.target.pool;
            logger.info(
                "[getProfitInWmatic]: profitInWMATIC: " +
                    fu(profitInWMATIC, 18) +
                    " gasRouter: " +
                    (await gasRouter.getAddress()) +
                    " gasPool: " +
                    (await gasPool.getAddress()),
            );
            return profitInWMATIC;
        }
    }

    // IF NEITHER TOKEN IS WMATIC, CHECK FOR A WMATIC POOL ON OTHER EXCHANGES.
    async scanAllExchangesForWMATIC(): Promise<bigint | undefined> {
        for (let f of Object.values(this.exchanges)) {
            // CHECK TOKENOUT -> WMATIC FIRST:
            let factory = new Contract(f.factory, IUniswapV2Factory, provider);
            let router = new Contract(f.router, IUniswapv2Router02, provider);
            let pair = await factory.getPair(this.trade.tokenOut.id, wmatic);
            pair !== zero ? pair : undefined;
            if (!pair) {
                console.log("Pair not found for token: " + this.trade.tokenOut.id);
                return undefined;
            }
            if (pair) {
                // find routerID using matching factory key (not property) from uniswapV2Factory:
                let factoryKey = Object.keys(uniswapV2Factory).find(
                    (key) => uniswapV2Factory[key] === f.factory,
                );
                logger.info("Factory Key for Profit in WMATIC calculation: " + factoryKey);
                if (!factoryKey) {
                    throw new Error("Factory: " + f + " not found in uniswapV2Factory");
                }
                let profitInWMATIC = await router.getAmountsOut(this.trade.profits.profitToken, [
                    this.trade.tokenOut.id,
                    wmatic,
                ]);
                return profitInWMATIC;
            }
        }
        // return undefined;
    }

    async scanAllExchangesForGasTokens(): Promise<bigint | undefined> {
        for (let f of Object.values(this.exchanges)) {
            for (let address of Object.keys(this.gasTokens)) {
                let match =
                    address == this.trade.tokenIn.id
                        ? this.trade.tokenIn.id
                        : address == this.trade.tokenOut.id
                        ? this.trade.tokenOut.id
                        : undefined;
                if (match !== undefined) {
                    let factory = new Contract(f.factory, IUniswapV2Factory, provider);
                    let router = new Contract(f.router, IUniswapv2Router02, provider);
                    let pair = await factory.getPair(match, wmatic);
                    pair !== zero ? pair : undefined;

                    if (!pair) {
                        console.log("Pair not found for token: " + match);
                        return undefined;
                    }

                    if (pair) {
                        let factoryKey = Object.keys(uniswapV2Factory).find(
                            (key) => uniswapV2Factory[key] === f.factory,
                        );
                        logger.info(
                            "Factory Key for Profit in WMATIC calculation: " +
                                factoryKey +
                                " for token: " +
                                match +
                                " and WMATIC",
                        );
                        let pool = new Contract(pair.pair, IPair, provider);
                        let amountsOut = await router.getAmountsOut(
                            this.trade.profits.profitToken,
                            [pair.tokenOut.id, address, this.wmaticID],
                        );
                        let profitInWMATIC = amountsOut[2];
                        let gasRouter = router;
                        let gasPool = pool;
                        return profitInWMATIC;
                    }
                }
            }
        }
    }
}

//         this.exchanges.find(async (f) => {
//             for (let address of Object.keys(gasTokens)) {
//                 let match =
//                     address == trade.tokenIn.id
//                         ? trade.tokenIn.id
//                         : address == trade.tokenOut.id
//                         ? trade.tokenOut.id
//                         : undefined;
//                 if (match !== undefined) {
//                     let factory = new Contract(f, IUniswapV2Factory, provider);
//                     let pair0 = await factory.getPair(trade.tokenIn.id, wmatic);
//                     let pair1 = await factory.getPair(trade.tokenOut.id, wmatic);
//                     let gasPair = pair1 !== zero ? pair1 : pair0;
//                     let pairContract = new Contract(gasPair, IPair, provider);
//                     let pair = {
//                         pair: gasPair,
//                         token: gasPair == pair1 ? trade.tokenOut.id : trade.tokenIn.id,
//                     };
//                     if (!pair) {
//                         pair = {
//                             pair: await factory.getPair(trade.tokenIn.id, address),
//                             token: trade.tokenIn.id,
//                         };
//                     }
//                     if (pair) {
//                         let routerID = Object.keys(uniswapV2Router).find(
//                             (key) => uniswapV2Router[key] === f,
//                         );
//                         if (!routerID) {
//                             throw new Error("Router not found for factory: " + f);
//                         }
//                         let router = new Contract(routerID, IUniswapv2Router02, provider);
//                         let pool = new Contract(pair.pair, IPair, provider);
//                         let amountsOut = await getAmountsOut(
//                             router,
//                             trade.profits.profitToken,
//                             [pair.token, address, wmatic],
//                         );
//                         let profitInWMATIC = amountsOut[2];
//                         let gasRouter = router;
//                         let gasPool = pool;
//                         wmaticProfit = { profitInWMATIC, gasRouter, gasPool };
//                         logger.info(
//                             "[getProfitInWmatic]: profitInWMATIC: " +
//                                 fu(profitInWMATIC, 18) +
//                                 " gasRouter: " +
//                                 (await gasRouter.getAddress()) +
//                                 " gasPool: " +
//                                 (await gasPool.token0())[Symbol()] +
//                                 "/" +
//                                 (await gasPool.token1())[Symbol()],
//                         );
//                         if (amountsOut[1] > pu("0.1", 18)) {
//                             return wmaticProfit;
//                         }
//                     }
//                 }
//             }
//         });
//     }
// }
// console.log(
//     "Token has no value in WMATIC: ",
//     trade.ticker,
//     trade.loanPool.exchange,
//     trade.target.exchange,
//     trade.profits.profitToken,
// );
// wmaticProfit = {
//     profitInWMATIC: 0n,
//     gasRouter: trade.loanPool.router,
//     gasPool: trade.target.pool,
// };
// return wmaticProfit;
// }

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
