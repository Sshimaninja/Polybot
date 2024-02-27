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
} from "../../../constants/interfaces";
import { abi as IFactory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IRouter } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { flashMulti, flashSingle } from "../../../constants/environment";
import { provider, wallet } from "../../../constants/provider";
import { Prices } from "./Prices";
import { getQuotes } from "../modules/price/getQuotes";
import { getK } from "../modules/tools/getK";
import { getFunds } from "../modules/tools/getFunds";
import { BoolTrade } from "../../../constants/interfaces";
import { PopulateRepays } from "./Repays";
import { AmountConverter } from "./AmountConverter";
import { BigInt2BN, BigInt2String, BN2BigInt, fu, pu } from "../../modules/convertBN";
import { filterTrade } from "../modules/filterTrade";
import { logger } from "../../../constants/logger";
import { ProfitCalculator } from "./ProfitCalcs";
import { getAmountsOut, getAmountsIn } from "../modules/price/getAmountsIOBN";
// import { getAmountsOut as getAmountOutBN, getAmountsIn as getAmountInBN } from "./modules/getAmounts/getAmountsIOBN";

/**
 * @description
 * Class to determine trade parameters
 * returns a BoolTrade object, which fills out all params needed for a trade.
 *
 */
export class Trade {
    // trade: BoolTrade
    pair: FactoryPair;
    match: TradePair;
    price0: Prices;
    price1: Prices;
    slip: BN;
    gasData: GasData;
    calc0: AmountConverter;
    calc1: AmountConverter;

    constructor(
        pair: FactoryPair,
        match: TradePair,
        price0: Prices,
        price1: Prices,
        slip: BN,
        gasData: GasData,
        // trade: BoolTrade
    ) {
        this.pair = pair;
        this.price0 = price0;
        this.price1 = price1;
        this.match = match;
        this.slip = slip;
        this.gasData = gasData;
        // Pass in the opposing pool's priceOut as target
        this.calc0 = new AmountConverter(price0, match, this.price1.priceOutBN);
        this.calc1 = new AmountConverter(price1, match, this.price0.priceOutBN);
    }

    async direction() {
        const A = this.price0.priceOutBN;
        const B = this.price1.priceOutBN;
        const diff = A.lt(B) ? B.minus(A) : A.minus(B);
        const dperc = diff.div(A.gt(B) ? A : B).multipliedBy(100); // 0.6% price difference required for trade (0.3%) + loan repayment (0.3%) on Uniswap V2
        const dir = A.gt(B) ? "A" : "B";
        return { dir, diff, dperc };
    }

    async getTrade() {
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.
        const dir = await this.direction();
        const A = dir.dir == "A" ? true : false;
        const size = A
            ? await this.calc0.getSize() //this.getSize(this.calc1, this.calc0)
            : await this.calc1.getSize(); //this.getSize(this.calc0, this.calc1);
        const trade: BoolTrade = {
            ID: A
                ? this.match.poolBID + this.match.poolAID
                : this.match.poolAID + this.match.poolBID,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: "filtered",
            ticker: this.match.token0.symbol + "/" + this.match.token1.symbol,
            tokenIn: this.match.token1,
            tokenOut: this.match.token0,
            flash: flashMulti, // flashMulti, // This has to be set initially, but must be changed later per type. Likely to be flashMulti uneless other protocols are added for single swaps.
            loanPool: {
                exchange: A ? this.pair.exchangeB : this.pair.exchangeA,
                factory: A
                    ? new Contract(this.pair.factoryB_id, IFactory, provider)
                    : new Contract(this.pair.factoryA_id, IFactory, provider),
                router: A
                    ? new Contract(this.pair.routerB_id, IRouter, provider)
                    : new Contract(this.pair.routerA_id, IRouter, provider),
                pool: A
                    ? new Contract(this.match.poolBID, IPair, provider)
                    : new Contract(this.match.poolAID, IPair, provider),
                reserveIn: A ? this.price1.reserves.reserveIn : this.price0.reserves.reserveIn,
                reserveInBN: A
                    ? this.price1.reserves.reserveInBN
                    : this.price0.reserves.reserveInBN,
                reserveOut: A ? this.price1.reserves.reserveOut : this.price0.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price1.reserves.reserveOutBN
                    : this.price0.reserves.reserveOutBN,
                priceIn: A
                    ? this.price1.priceInBN.toFixed(this.match.token1.decimals)
                    : this.price0.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.price1.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.price0.priceOutBN.toFixed(this.match.token0.decimals),
                repays: {
                    single: 0n,
                    flashSingle: { singleIn: 0n, singleOut: 0n },
                    flashMulti: 0n,
                },
                amountRepay: 0n,
            },
            target: {
                exchange: A ? this.pair.exchangeA : this.pair.exchangeB,
                factory: A
                    ? new Contract(this.pair.factoryA_id, IFactory, provider)
                    : new Contract(this.pair.factoryB_id, IFactory, provider),
                router: A
                    ? new Contract(this.pair.routerA_id, IRouter, provider)
                    : new Contract(this.pair.routerB_id, IRouter, provider),
                pool: A
                    ? new Contract(this.match.poolAID, IPair, provider)
                    : new Contract(this.match.poolBID, IPair, provider),
                reserveIn: A ? this.price0.reserves.reserveIn : this.price1.reserves.reserveIn,
                reserveInBN: A
                    ? this.price0.reserves.reserveInBN
                    : this.price1.reserves.reserveInBN,
                reserveOut: A ? this.price0.reserves.reserveOut : this.price1.reserves.reserveOut,
                reserveOutBN: A
                    ? this.price0.reserves.reserveOutBN
                    : this.price1.reserves.reserveOutBN,
                priceIn: A
                    ? this.price0.priceInBN.toFixed(this.match.token1.decimals)
                    : this.price1.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.price0.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.price1.priceOutBN.toFixed(this.match.token0.decimals),
                tradeSize: size,
                walletSize: size,
            },
            quotes: {
                target: {
                    out: 0n,
                    outBN: BN(0),
                    flashOut: 0n,
                    flashOutBN: BN(0),
                },
                loanPool: {
                    out: 0n,
                    outBN: BN(0),
                    flashOut: 0n,
                    flashOutBN: BN(0),
                },
            },
            gas: this.gasData,
            k: {
                uniswapKPre: 0n,
                uniswapKPost: 0n,
                uniswapKPositive: false,
            },
            differenceTokenOut:
                dir.diff.toFixed(this.match.token0.decimals) + " " + this.match.token0.symbol,
            differencePercent: dir.dperc.toFixed(this.match.token0.decimals) + "%",
            profits: {
                tokenProfit: 0n,
                WMATICProfit: 0n,
                profitPercent: "",
            },
        };

        const quote = await getQuotes(trade);

        const r = new PopulateRepays(trade, this.calc0);
        const repays = await r.getRepays();

        const p = new ProfitCalculator(trade, this.calc0, repays);
        const multi = await p.getMultiProfit();
        const single = await p.getSingleProfit();

        let maxProfit;
        let tradeType;

        if (single.flashProfit > multi.flashProfit) {
            maxProfit = single.flashProfit;
            tradeType = "flashSingle";
        } else {
            maxProfit = multi.flashProfit;
            tradeType = "flashMulti";
        }

        if (single.profit > maxProfit) {
            // maxProfit = single.profit;
            tradeType = "single";
        }

        trade.type = tradeType;
        trade.loanPool.repays = repays;
        trade.target.tradeSize =
            trade.type === "flashMulti"
                ? trade.target.tradeSize
                : trade.type === "flashSingle"
                ? trade.target.tradeSize
                : trade.target.walletSize;

        trade.profits.tokenProfit =
            trade.type === "flashMulti"
                ? multi.flashProfit
                : trade.type === "flashSingle"
                ? single.flashProfit
                : single.profit;

        trade.profits.profitPercent = await p.getProfitPercent(trade.tokenOut.decimals);

        trade.loanPool.amountRepay =
            trade.type === "flashMulti"
                ? repays.flashMulti
                : trade.type === "flashSingle"
                ? repays.flashSingle.singleOut
                : repays.single;

        trade.k = await getK(
            trade.type,
            trade.target.tradeSize.size,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            this.calc0,
        );

        trade.flash = trade.type === "flashSingle" ? flashSingle : flashMulti;

        return trade;
    }
}
