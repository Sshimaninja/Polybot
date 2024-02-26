import { ethers, Contract } from "ethers";
import { BoolTrade /*WmaticProfit*/ } from "../../../constants/interfaces";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { getAmountsOut } from "../modules/getAmounts/getAmountsIOJS";
import { BigNumber as BN } from "bignumber.js";
import { getAmountsOut as getAmountsOutBN } from "../modules/getAmounts/getAmountsIOBN";
import {
    // gasTokens,
    toWMATIC,
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
    tokenProfitBN: BN;
    toWMATIC: any;
    constructor(trade: BoolTrade, gasTokens: GasToken, exchanges: ExchangeMap) {
        this.gasTokens = gasTokens;
        this.exchanges = exchanges;
        this.trade = trade;
        this.wmaticID = this.gasTokens.WMATIC;
        this.profitInWMATIC = 0n;
        this.gasRouter = trade.loanPool.router;
        this.gasPool = trade.target.pool;
        this.tokenProfitBN = BN(fu(this.trade.profits.profitToken, this.trade.tokenOut.decimals));
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
            profitInWMATIC = await this.gasTokentoWMATICPrice();
        } else if (profitInWMATIC === undefined) {
            console.log(
                "Profit token has no value: ",
                this.trade.ticker,
                "Profit in tokenOut: ",
                fu(this.trade.profits.profitToken, this.trade.tokenOut.decimals),
            );
            profitInWMATIC = 0n;
        }
        if (profitInWMATIC === undefined) {
            console.log(
                ">>>>>>>>>>>>>>>>>>>>>>>>Profit in WMATIC is undefined. trade: ",
                this.trade.ticker,
                "<<<<<<<<<<<<<<<<<<<<<<<<<<",
            );
            return 0n;
        }
        return profitInWMATIC;
    }

    async tokenOutisWMATIC(): Promise<bigint | undefined> {
        if (this.trade.tokenOut.id == this.wmaticID) {
            console.log("[getProfitInWmatic]: tokenOut is WMATIC");
            let profitInWMATIC = this.trade.profits.profitToken;
            let gasRouter = this.trade.target.router;
            let gasPool = this.trade.target.pool;
            // console.log(
            //     "[getProfitInWmatic]: profitInWMATIC: " +
            //         fu(profitInWMATIC, 18) +
            //         " gasRouter: " +
            //         (await gasRouter.getAddress()) +
            //         " gasPool: " +
            //         (await gasPool.getAddress()),
            // );
            return profitInWMATIC;
        }
    }

    async tokenInisWMATIC(): Promise<bigint | undefined> {
        if (this.trade.tokenIn.id == this.wmaticID) {
            console.log("[getprofitInWMATIC]: tokenIn is WMATIC");
            // console.log(
            //     "[getProfitInWmatic] CHECK TOKENPROFIT TO BN CONVERSION: ",
            //     this.tokenProfitBN,
            //     this.tokenProfitBN.toFixed(this.trade.tokenOut.decimals),
            // );
            let inMatic = await getAmountsOutBN(
                this.tokenProfitBN,
                this.trade.target.reserveOutBN,
                this.trade.target.reserveInBN,
            );
            // let inMatic = await this.trade.loanPool.router.getAmountsOut(
            //     this.trade.profits.profitToken,
            //     [this.trade.tokenOut.id, wmatic],
            // );
            // console.log(
            //     "[getProfitInWmatic] CHECK TOKENPROFITBN TO WMATIC CONVERSION: ",
            //     inMatic,
            //     inMatic.toFixed(this.trade.tokenOut.decimals),
            // );

            let gasRouter = this.trade.loanPool.router;
            let gasPool = this.trade.target.pool;

            let profitInWMATIC = pu(inMatic.toFixed(18), 18);
            console.log(
                ">>>>>>>>>>>>>>>>>>>[getProfitInWmatic]:  profitInWMATICBN:  " + inMatic,
                " string: ",
                inMatic.toFixed(18),
                " bigint: ",
                profitInWMATIC,
                "<<<<<<<<<<<<<<<<<<<<<<<<<",
                " bigint string: ",
                fu(profitInWMATIC, 18),
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
                // console.log("Factory Key for Profit in WMATIC calculation: " + factoryKey);
                if (!factoryKey) {
                    throw new Error("Factory: " + f + " not found in uniswapV2Factory");
                }
                let pairC = new Contract(pair, IPair, provider);
                let r = await pairC.getReserves();
                let r0 = r[0];
                let r1 = r[1];
                r0 = BN(r0);
                r1 = BN(r1);
                // console.log("Check bn conversion: ", r0, r1);
                let profitInWMATICBN: BN;
                if ((await pairC.token0()) === this.wmaticID) {
                    profitInWMATICBN = await getAmountsOutBN(this.tokenProfitBN, r1, r0);
                }
                if ((await pairC.token1()) === this.wmaticID) {
                    profitInWMATICBN = await getAmountsOutBN(this.tokenProfitBN, r0, r1);
                } else {
                    return undefined;
                }
                let profitInWMATIC = pu(profitInWMATICBN.toFixed(this.trade.tokenOut.decimals), 18);
                console.log(
                    ">>>>>>>>>>>>>>>>>>>[getProfitInWmatic]: profitInWMATICBN: ",
                    profitInWMATICBN,
                    " string: ",
                    profitInWMATICBN.toFixed(18),
                    " bigint: ",
                    profitInWMATIC,
                    " bigint string: ",
                    fu(profitInWMATIC, 18),
                    "<<<<<<<<<<<<<<<<<<<<<<<<<",
                );
                return profitInWMATIC;
            }
            return undefined;
        }
    }

    // IF NEITHER TOKEN IS WMATIC, USE toWMATIC object to get gasToken -> WMATIC price.

    async gasTokentoWMATICPrice(): Promise<bigint | undefined> {
        let profitInWMATIC: bigint | undefined;
        for (let tokenIn of Object.keys(toWMATIC)) {
            if (tokenIn == this.trade.tokenOut.id) {
                let token = this.toWMATIC[tokenIn];
                let profitInWMATICBN = await getAmountsOutBN(
                    this.tokenProfitBN,
                    token.reserves.reserve0,
                    token.reserves.reserve1,
                );
                profitInWMATIC = pu(profitInWMATICBN.toFixed(18), 18);
                // return profitInWMATIC;
            }
            if (tokenIn == this.trade.tokenIn.id) {
                let token = this.toWMATIC[tokenIn];

                let profitInToken0 = this.tokenProfitBN.multipliedBy(this.trade.loanPool.priceIn);
                let profitInWMATICBN = await getAmountsOutBN(
                    this.tokenProfitBN,
                    token.reserves.reserve0,
                    token.reserves.reserve1,
                );
                profitInWMATIC = pu(profitInWMATICBN.toFixed(18), 18);
            }
            return profitInWMATIC;
        }
    }

    // export const toWMATIC = {
    //     "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619": {
    //         ticker: "ETHWMATIC",
    //         id: "0xadbF1854e5883eB8aa7BAf50705338739e558E5b",
    //         exchange: "QUICK",
    //         tokenIn: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: {
    //             reserve0: 454316351407229260525n,
    //             reserve1: 1359855875041370319871605n,
    //         },
    //         liquidity: 617804759588480440177444411257351417094892625n,
    //     },
    //     "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": {
    //         ticker: "USDCWMATIC",
    //         id: "0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827",
    //         exchange: "QUICK",
    //         tokenIn: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: { reserve0: 1161146404460n, reserve1: 1111991300426165069868546n },
    //         liquidity: 1291184700280641236584306872748115160n,
    //     },
    //     "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
    //         ticker: "USDTWMATIC",
    //         id: "0x604229c960e5CACF2aaEAc8Be68Ac07BA9dF81c3",
    //         exchange: "QUICK",
    //         tokenIn: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: { reserve0: 336152405054n, reserve1: 321393040088091915558702n },
    //         liquidity: 108037043393228733440871559418479908n,
    //     },
    //     "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": {
    //         ticker: "DAIWMATIC",
    //         id: "0xEEf611894CeaE652979C9D0DaE1dEb597790C6eE",
    //         exchange: "QUICK",
    //         tokenIn: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: {
    //             reserve0: 10048054644023146532118n,
    //             reserve1: 9631474205336469374047n,
    //         },
    //         liquidity: 96777579117720255903494240539631102241141546n,
    //     },
    //     "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6": {
    //         ticker: "WBTCWMATIC",
    //         id: "0xf6B87181BF250af082272E3f448eC3238746Ce3D",
    //         exchange: "QUICK",
    //         tokenIn: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: { reserve0: 22647769n, reserve1: 11541797837604398053611n },
    //         liquidity: 261395971270763920502231543859n,
    //     },
    //     "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7": {
    //         ticker: "GHSTWMATIC",
    //         id: "0x1366c529a133D4153211410126F12Aa4e31AaAc5",
    //         exchange: "QUICK",
    //         tokenIn: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    //         tokenOut: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    //         reserves: {
    //             reserve0: 873606219290375554739n,
    //             reserve1: 873746681901906779595n,
    //         },
    //         liquidity: 763310535393835188071081054011763130750705n,
    //     },
    // };

    // return undefined;

    //     async scanAllExchangesForGasTokens(): Promise<bigint | undefined> {
    //         let profitInWMATIC: bigint | undefined;
    //         for (let f of Object.values(this.exchanges)) {
    //             for (let address of Object.keys(this.gasTokens)) {
    //                 if (address == this.trade.tokenOut.id) {
    //                     let factory = new Contract(f.factory, IUniswapV2Factory, provider);
    //                     let pairID = await factory.getPair(wmatic, address);

    //                     if (pairID) {
    //                         let pair = new Contract(pairID, IPair, provider);
    //                         const token0 = {
    //                             id: await pair.token0(),
    //                             decimals: await pair.decimals(),
    //                             reserves: (await pair.getReserves())[0],
    //                         };
    //                         const token1 = {
    //                             id: await pair.token1(),
    //                             decimals: await pair.decimals(),
    //                             reserves: (await pair.getReserves())[1],
    //                         };

    //                         const tokenIn = token0.id === this.trade.tokenOut.id ? token0 : token1;
    //                         const tokenOut = token0.id === this.trade.tokenOut.id ? token1 : token0;

    //                         let amountsOut = await getAmountsOutBN(
    //                             this.tokenProfitBN,
    //                             tokenIn.reserves,
    //                             tokenOut.reserves,
    //                         );

    //                         return (profitInWMATIC = pu(amountsOut.toFixed(18), 18));
    //                     }
    //                 }

    //                 if (address == this.trade.tokenIn.id) {
    //                     let factory = new Contract(f.factory, IUniswapV2Factory, provider);
    //                     let pairID = await factory.getPair(wmatic, address);

    //                     if (pairID) {
    //                         let pair = new Contract(pairID, IPair, provider);
    //                         const token0 = {
    //                             id: await pair.token0(),
    //                             decimals: await pair.decimals(),
    //                             reserves: (await pair.getReserves())[0],
    //                         };
    //                         const token1 = {
    //                             id: await pair.token1(),
    //                             decimals: await pair.decimals(),
    //                             reserves: (await pair.getReserves())[1],
    //                         };

    //                         const tokenIn = token0.id === this.trade.tokenIn.id ? token0 : token1;
    //                         const tokenOut = token0.id === this.trade.tokenIn.id ? token1 : token0;

    //                         let profitInToken0 = this.tokenProfitBN.multipliedBy(
    //                             this.trade.loanPool.priceIn,
    //                         );

    //                         let amountsOut = await getAmountsOutBN(
    //                             profitInToken0,
    //                             tokenIn.reserves,
    //                             tokenOut.reserves,
    //                         );
    //                         console.log(
    //                             "scanAllExchangesForGasTokens amountsOut: ",
    //                             amountsOut.toFixed(18),
    //                         );
    //                         return (profitInWMATIC = pu(amountsOut.toFixed(18), 18));
    //                     }
    //                 }
    //             }
    //             if (!profitInWMATIC) {
    //                 console.log("Pair not found for ", this.trade.tokenOut);
    //             }
    //         }
    //     }
}
