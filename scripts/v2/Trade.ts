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
import { getFunds } from "./modules/tools/getFunds";
import { BoolTrade } from "../../constants/interfaces";
import { PopulateRepays } from "./classes/Repays";
import { AmountConverter } from "./classes/AmountConverter";
import { BigInt2BN, BigInt2String, BN2BigInt, fu, pu } from "../modules/convertBN";
import { filterTrade } from "./modules/filterTrade";
import { logger } from "../../constants/logger";
import { ProfitCalculator } from "./classes/ProfitCalcs";
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
    priceA: Prices;
    priceB: Prices;
    slip: BN;
    gasData: GasData;
    calcA: AmountConverter;
    calcB: AmountConverter;

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
        this.calcA = new AmountConverter(
            this.priceB,
            this.priceA,
            this.match,
            this.priceB.priceOutBN,
        );
        this.calcB = new AmountConverter(
            this.priceA,
            this.priceB,
            this.match,
            this.priceA.priceOutBN,
        );
    }

    async direction() {
        const A = this.priceA.priceOutBN;
        const B = this.priceB.priceOutBN;
        const diff = A.lt(B) ? B.minus(A) : A.minus(B);
        const dperc = diff.div(A.gt(B) ? A : B).multipliedBy(100); // 0.6% price difference required for trade (0.3%) + loa`n repayment (0.3%) on Uniswap V2
        const dir = A.gt(B) ? "A" : "B";
        return { dir, diff, dperc };
    }

    async getBal(): Promise<{
        tokenInBalance: bigint;
        tokenOutBalance: bigint;
        gasBalance: bigint;
    }> {
        const signerID = await signer.getAddress();
        const tokenIn: Contract = new Contract(this.match.token1.id, IERC20, provider);
        const tokenOut: Contract = new Contract(this.match.token0.id, IERC20, provider);
        let bal = {
            tokenInBalance: await tokenIn.balanceOf(signerID),
            tokenOutBalance: await tokenOut.balanceOf(signerID),
            gasBalance: await provider.getBalance(signerID),
        };
        return bal;
    }

    async getTrade() {
        //TODO: Add complexity: use greater reserves for loanPool, lesser reserves for target.
        const dir = await this.direction();
        const A = dir.dir == "A" ? true : false;
        const size = A
            ? await this.calcA.getSize() //this.getSize(this.calcB, this.calcA)
            : await this.calcB.getSize(); //this.getSize(this.calcA, this.calcB);
        const trade: BoolTrade = {
            ID: A
                ? this.match.poolBID + this.match.poolAID
                : this.match.poolAID + this.match.poolBID,
            pending: false,
            block: await provider.getBlockNumber(),
            direction: dir.dir,
            type: "filtered",
            ticker: this.match.token0.symbol + "/" + this.match.token1.symbol,
            tokenIn: this.match.token1,
            tokenOut: this.match.token0,
            flash: flashMulti, // flashMulti, // This has to be set initially, but must be changed later per type. Likely to be flashMulti uneless other protocols are added for single swaps.
            wallet: await this.getBal(),
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
                reserveIn: A ? this.priceB.reserves.reserveIn : this.priceA.reserves.reserveIn,
                reserveInBN: A
                    ? this.priceB.reserves.reserveInBN
                    : this.priceA.reserves.reserveInBN,
                reserveOut: A ? this.priceB.reserves.reserveOut : this.priceA.reserves.reserveOut,
                reserveOutBN: A
                    ? this.priceB.reserves.reserveOutBN
                    : this.priceA.reserves.reserveOutBN,
                priceIn: A
                    ? this.priceB.priceInBN.toFixed(this.match.token1.decimals)
                    : this.priceA.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.priceB.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.priceA.priceOutBN.toFixed(this.match.token0.decimals),
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
                    ? new Contract(this.pair.factoryA_id, IFactory, provider)
                    : new Contract(this.pair.factoryB_id, IFactory, provider),
                router: A
                    ? new Contract(this.pair.routerA_id, IRouter, provider)
                    : new Contract(this.pair.routerB_id, IRouter, provider),
                pool: A
                    ? new Contract(this.match.poolAID, IPair, provider)
                    : new Contract(this.match.poolBID, IPair, provider),
                reserveIn: A ? this.priceA.reserves.reserveIn : this.priceB.reserves.reserveIn,
                reserveInBN: A
                    ? this.priceA.reserves.reserveInBN
                    : this.priceB.reserves.reserveInBN,
                reserveOut: A ? this.priceA.reserves.reserveOut : this.priceB.reserves.reserveOut,
                reserveOutBN: A
                    ? this.priceA.reserves.reserveOutBN
                    : this.priceB.reserves.reserveOutBN,
                priceIn: A
                    ? this.priceA.priceInBN.toFixed(this.match.token1.decimals)
                    : this.priceB.priceInBN.toFixed(this.match.token1.decimals),
                priceOut: A
                    ? this.priceA.priceOutBN.toFixed(this.match.token0.decimals)
                    : this.priceB.priceOutBN.toFixed(this.match.token0.decimals),
                tradeSize: size,
                walletSize: size,
            },
            quotes: {
                target: {
                    out: 0n,
                    flashOut: 0n,
                    in: 0n,
                    flashIn: 0n,
                },
                loanPool: {
                    out: 0n,
                    flashOut: 0n,
                    in: 0n,
                    flashIn: 0n,
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
        // const debug = await debugAmounts(trade);
        // logger.info(">>>>>>>>>>>>>DEBUG: ", debug);
        const quote = await getQuotes(trade);

        const r = new PopulateRepays(trade, this.calcA);
        const repays = await r.getRepays();

        const p = new ProfitCalculator(trade, this.calcA, repays);
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
        // console.log(">>>>>>>>>>>repays: ", repays);
        // console.log(">>>>>>>>>>>trade.repays: ", trade.loanPool.repays);
        // console.log(">>>>>>>>>>>amountRepay: ", trade.loanPool.amountRepay);

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
                ? repays.flashSingle
                : repays.single;

        trade.k = await getK(
            trade.type,
            trade.target.tradeSize.size,
            trade.loanPool.reserveIn,
            trade.loanPool.reserveOut,
            this.calcA,
        );

        trade.flash = trade.type === "flashSingle" ? flashSingle : flashMulti;

        return trade;
    }
}
