import { BigNumber as BN } from "bignumber.js";
import { ethers, Contract } from "ethers";
import {
    Amounts,
    FactoryPair,
    GasData,
    Pair,
    Profcalcs,
    Repays,
    TradePair,
} from "../../constants/interfaces";
import { abi as IERC20 } from "@uniswap/v2-periphery/build/IERC20.json";
import { debugAmounts } from "../../test/debugAmounts";
import { abi as IFactory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IRouter } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { flashMulti, flashSingle } from "../../constants/environment";
import { provider, signer } from "../../constants/provider";
import { Prices } from "./classes/Prices";
import { getQuotes } from "./modules/price/getQuotes";
import { getK } from "./modules/tools/getK";
import { walletTradeSize } from "./modules/tools/walletTradeSizes";
import { getFunds } from "./modules/tools/getFunds";
import { BoolTrade } from "../../constants/interfaces";
import { PopulateRepays } from "./classes/Repays";
import { AmountConverter } from "./classes/AmountConverter";
import { BigInt2BN, BigInt2String, BN2BigInt, fu, pu } from "../modules/convertBN";
import { filterTrade } from "./modules/filterTrade";
import { logger } from "../../constants/logger";
import { ProfitCalculator } from "./classes/ProfitCalcs";
import { params } from "./modules/transaction/params";
// import { getAmountsOut as getAmountOutBN, getAmountsIn as getAmountInBN } from "./modules/getAmounts/getAmountsIOBN";

/**
 * @description
 * Class to determine trade parameters
 * returns a BoolTrade object, which fills out all params needed for a trade.
 *
 */

// TODO: MAKE THIS BOT TOKEN0 TO TOKEN1 (USUALLY WMATIC IS TOKENIN THIS WAY) MAKING SINGLE TRADES EASIER

export class Trade {
    // trade: BoolTrade
    pair: FactoryPair;
    match: TradePair;
    priceA: Prices;
    priceB: Prices;
    slip: BN;
    gasData: GasData;

    constructor(
        pair: FactoryPair,
        match: TradePair,
        priceA: Prices,
        priceB: Prices,
        slip: BN,
        gasData: GasData,
        // trade: BoolTrade
    ) {
        this.pair = pair;
        this.priceA = priceA;
        this.priceB = priceB;
        this.match = match;
        this.slip = slip;
        this.gasData = gasData;
        // Pass in the opposing pool's priceOut as target
        // this.calcA = new AmountConverter(this.priceB, this.priceA, this.match);
        // this.calcB = new AmountConverter(this.priceA, this.priceB, this.match);
    }

    async direction() {
        const A = this.priceA.priceOutBN;
        const B = this.priceB.priceOutBN;
        const diff = A.lt(B) ? B.minus(A) : A.minus(B);
        const dperc = diff.div(A.gt(B) ? A : B).multipliedBy(100); // 0.6% price difference required for trade (0.3%) + loa`n repayment (0.3%) on Uniswap V2
        const dir = A.gt(B) ? "A" : "B";
        return { dir, diff, dperc };
    }

    // TODO: SWITCH BACK TO 0 to 1
    async getTrade() {
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.
        const dir = await this.direction();
        const A = dir.dir == "A" ? true : false;
        const signerID = await signer.getAddress();
        const tokenIn: Contract = new Contract(this.match.token0.id, IERC20, signer);
        const tokenOut: Contract = new Contract(this.match.token1.id, IERC20, signer);
        const trade: BoolTrade = {
            ID: A
                ? this.match.poolBID + this.match.poolAID
                : this.match.poolAID + this.match.poolBID,
            pending: false,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: "filtered",
            ticker: A
                ? this.match.token0.symbol + "/" + this.match.token1.symbol
                : this.match.token1.symbol + "/" + this.match.token0.symbol,
            tokenIn: {
                data: this.match.token0,
                contract: new Contract(this.match.token0.id, IERC20, signer),
            },
            tokenOut: {
                data: this.match.token1,
                contract: new Contract(this.match.token1.id, IERC20, signer),
            },
            flash: flashMulti,
            // TradeSizes must default to toPrice/flash sizes in order to calculate repays later. If flash is not used, these will be reassigned.
            // if
            tradeSizes: {
                loanPool: {
                    tradeSizeTokenIn: {
                        size: 0n,
                        sizeBN: BN(0),
                    },
                },
                target: {
                    tradeSizeTokenOut: {
                        size: 0n,
                        sizeBN: BN(0),
                    },
                },
            },
            wallet: {
                tokenInBalance: await tokenIn.balanceOf(signerID),
                tokenOutBalance: await tokenOut.balanceOf(signerID),
                maticBalance: await provider.getBalance(signerID),
            },
            loanPool: {
                exchange: A ? this.pair.exchangeB : this.pair.exchangeA,
                factory: A
                    ? new Contract(this.pair.factoryB_id, IFactory, signer)
                    : new Contract(this.pair.factoryA_id, IFactory, signer),
                router: A
                    ? new Contract(this.pair.routerB_id, IRouter, signer)
                    : new Contract(this.pair.routerA_id, IRouter, signer),
                pool: A
                    ? new Contract(this.match.poolBID, IPair, signer)
                    : new Contract(this.match.poolAID, IPair, signer),
                reserveIn: A ? this.priceB.reserves.reserveIn : this.priceA.reserves.reserveIn,
                reserveInBN: A
                    ? this.priceB.reserves.reserveInBN
                    : this.priceA.reserves.reserveInBN,
                reserveOut: A ? this.priceB.reserves.reserveOut : this.priceA.reserves.reserveOut,
                reserveOutBN: A
                    ? this.priceB.reserves.reserveOutBN
                    : this.priceA.reserves.reserveOutBN,
                priceIn: A
                    ? this.priceB.priceInBN.toFixed(this.match.token0.decimals)
                    : this.priceA.priceInBN.toFixed(this.match.token0.decimals),
                priceOut: A
                    ? this.priceB.priceOutBN.toFixed(this.match.token1.decimals)
                    : this.priceA.priceOutBN.toFixed(this.match.token1.decimals),
                repays: {
                    single: 0n,
                    flashSingle: 0n,
                    flashMulti: 0n,
                },
                amountRepay: 0n,
            },
            target: {
                exchange: A ? this.pair.exchangeA : this.pair.exchangeB,
                factory: A
                    ? new Contract(this.pair.factoryA_id, IFactory, signer)
                    : new Contract(this.pair.factoryB_id, IFactory, signer),
                router: A
                    ? new Contract(this.pair.routerA_id, IRouter, signer)
                    : new Contract(this.pair.routerB_id, IRouter, signer),
                pool: A
                    ? new Contract(this.match.poolAID, IPair, signer)
                    : new Contract(this.match.poolBID, IPair, signer),
                reserveIn: A ? this.priceA.reserves.reserveIn : this.priceB.reserves.reserveIn,
                reserveInBN: A
                    ? this.priceA.reserves.reserveInBN
                    : this.priceB.reserves.reserveInBN,
                reserveOut: A ? this.priceA.reserves.reserveOut : this.priceB.reserves.reserveOut,
                reserveOutBN: A
                    ? this.priceA.reserves.reserveOutBN
                    : this.priceB.reserves.reserveOutBN,
                priceIn: A ? this.priceA.priceInBN : this.priceB.priceInBN,
                priceOut: A ? this.priceA.priceOutBN : this.priceB.priceOutBN,
            },
            quotes: {
                target: {
                    tokenInOut: 0n,
                    tokenOutOut: 0n,
                },
                loanPool: {
                    tokenInOut: 0n,
                    tokenOutOut: 0n,
                },
            },
            gas: this.gasData,
            k: {
                uniswapKPre: 0n,
                uniswapKPost: 0n,
                uniswapKPositive: false,
            },
            differenceTokenOut:
                dir.diff.toFixed(this.match.token1.decimals) + " " + this.match.token1.symbol,
            differencePercent: dir.dperc.toFixed(this.match.token1.decimals) + "%",
            profits: {
                tokenProfit: 0n,
                WMATICProfit: 0n,
            },
            params: "no trade",
        };

        const calc = new AmountConverter(trade);
        trade.tradeSizes = await calc.getSize();
        // : await this.calcB.getSize(); //this.getSize(this.calcA, this.calcB);
        // const debug = await debugAmounts(trade);
        // logger.info(">>>>>>>>>>>>>DEBUG: ", debug);
        const quotes = await getQuotes(trade);

        const r = new PopulateRepays(trade, calc);
        const repays = await r.getRepays();
        trade.loanPool.repays = repays;

        const p = new ProfitCalculator(trade, calc, repays, quotes);
        const multi = await p.getMultiProfit();
        const single = await p.getSingleProfit();

        if (
            multi.flashProfit <= 0n &&
            multi.singleProfit <= 0n &&
            single.flashProfit <= 0n &&
            single.singleProfit <= 0n
        ) {
            trade.type = "filtered: 0 profit";
            return trade;
        }

        let maxProfit =
            multi.flashProfit > single.flashProfit ? multi.flashProfit : single.flashProfit;

        maxProfit = maxProfit > single.singleProfit ? maxProfit : single.singleProfit;

        trade.type =
            maxProfit === single.singleProfit
                ? "single"
                : maxProfit === multi.flashProfit
                ? "flashMulti"
                : maxProfit === single.flashProfit
                ? "flashSingle"
                : maxProfit === 0n
                ? "filtered: 0 profit"
                : "filtered: unknown";

        // logger.info(
        //     "CHECK CALCS: maxProfit: ",
        //     fu(maxProfit, trade.tokenOut.data.decimals),
        //     " tradeType: ",
        //     trade.type,
        // );

        trade.profits.tokenProfit = maxProfit;

        // logger.info(
        //     "CHECK CALCS: trade.profits.tokenProfit: ",
        //     fu(trade.profits.tokenProfit, trade.tokenOut.data.decimals),
        //     " tradeType: ",
        //     trade.type,
        // );

        let walletTradeSizes = await walletTradeSize(trade);

        trade.tradeSizes.loanPool.tradeSizeTokenIn.size =
            trade.type === "single"
                ? walletTradeSizes.tokenOut
                : trade.tradeSizes.loanPool.tradeSizeTokenIn.size;

        trade.profits.tokenProfit =
            trade.type === "single"
                ? single.singleProfit
                : trade.type === "flashMulti"
                ? multi.flashProfit
                : trade.type === "flashSingle"
                ? single.flashProfit
                : 0n;

        // logger.info(
        //     "CHECK CALCS: trade.profits.tokenProfit: ",
        //     fu(trade.profits.tokenProfit, trade.tokenOut.data.decimals),
        //     // trade.tokenOut.data.decimals,
        //     // "WMATICProfit: ",
        //     // fu(trade.profits.WMATICProfit, 18),
        //     // "WMATIC",
        //     "tradeType: ",
        //     trade.type,
        // );

        trade.loanPool.amountRepay =
            trade.type === "flashMulti"
                ? repays.flashMulti
                : trade.type === "flashSingle"
                ? repays.flashSingle
                : repays.single;

        trade.type === "single"
            ? (trade.quotes = {
                  target: {
                      tokenInOut: quotes.target.tokenInOut,
                      tokenOutOut: quotes.target.tokenOutOut,
                  },
                  loanPool: {
                      tokenInOut: quotes.loanPool.tokenInOut,
                      tokenOutOut: quotes.loanPool.tokenOutOut,
                  },
              })
            : (trade.quotes = {
                  target: {
                      tokenInOut: quotes.target.flashTokenOutOut,
                      tokenOutOut: quotes.target.flashTokenOutOut,
                  },
                  loanPool: {
                      tokenInOut: quotes.loanPool.flashTokenInOut,
                      tokenOutOut: quotes.loanPool.flashTokenOutOut,
                  },
              });

        trade.k = await getK(
            trade.type,
            trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            calc,
        );

        trade.flash = trade.type === "flashSingle" ? flashSingle : flashMulti;

        return trade;
    }
}
