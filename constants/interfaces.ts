import { BaseContract, Contract, ethers } from "ethers";
import { BigNumber as BN } from "bignumber.js";
import { Token as V3Token } from "@uniswap/sdk-core";
import { AmountConverter as CalcV2 } from "../scripts/v2/classes/AmountConverter";
import { TransactionReceipt } from "alchemy-sdk";
export interface K {
    uniswapKPre: bigint;
    uniswapKPost: bigint;
    uniswapKPositive: boolean;
}

export interface PendingTx {
    ID: string;
    warning: boolean;
}
export interface TxData {
    txResponse: ethers.TransactionResponse | undefined;
    pendingID: string | null;
}

// export interface WmaticProfit {
//     profitInWMATIC: bigint;
//     gasRouter: Contract | undefined;
//     gasPool: Contract | undefined;
// }

export interface V2Params {
    loanFactory: string;
    targetRouter: string;
    token0ID: string;
    token1ID: string;
    amount0In: bigint;
    amount1Out: bigint;
    amountToRepay: bigint;
}

export interface V2Tx {
    flashParams: V2Params;
    gasObj: TxGas;
}

export interface TxGas {
    type: number;
    gasPrice: bigint;
    maxFee: bigint;
    maxPriority: bigint;
    gasLimit: bigint;
}

export interface Factory {
    exchange: string;
    factoryID: string;
    // pairs: Pair[];
}
export interface FactoryPair {
    exchangeA: string;
    factoryA_id: string;
    routerA_id: string;
    exchangeB: string;
    factoryB_id: string;
    routerB_id: string;
    matches: TradePair[];
}

export interface Pair {
    ticker: string;
    poolID: string;
    token0: {
        symbol: string;
        id: string;
        decimals: number;
    };
    token1: {
        symbol: string;
        id: string;
        decimals: number;
    };
}

export interface TradePair {
    ticker: string;
    poolAID: string;
    poolBID: string; // Changed from poolA_id and poolB_id
    token0: {
        symbol: string;
        id: string;
        decimals: number;
    };
    token1: {
        symbol: string;
        id: string;
        decimals: number;
    };
}

export interface Token {
    symbol: string;
    id: string;
    decimals: number;
}
export interface PoolInfo {
    exchange: string;
    protocol: string;
    id: string;
    fee: number;
    tickSpacing: number;
}

export interface Reserves3 {
    balance0: bigint;
    balance1: bigint;
    reserves0: bigint;
    reserves1: bigint;
    reserves0BN: BN;
    reserves1BN: BN;
    reserves0String: string;
    reserves1String: string;
}

export interface PoolState {
    poolID: string;
    sqrtPriceX96: bigint;
    liquidity: bigint;
    liquidityBN: BN;
    // balance0:  bigint;
    // balance1:  bigint;
    reservesIn: bigint;
    reservesOut: bigint;
    reservesInBN: BN;
    reservesOutBN: BN;
    inRangeReserves0: string;
    inRangeReserves1: string;
    priceIn: string;
    priceOut: string;
    priceInBN: BN;
    priceOutBN: BN;
}
export interface Profit {
    tokenProfit: bigint;
    WMATICProfit: bigint;
    gasData: GasData;
}
export interface Amounts {
    maxIn: bigint;
    maxOut: bigint;
    toPrice: bigint;
}
export interface Slot0 {
    sqrtPriceX96: bigint;
    sqrtPriceX96BN: BN;
    tick: number;
    fee: number;
    unlocked: boolean;
}
export interface DeployedPools {
    poolID: string;
    token0: string;
    token1: string;
    tickSpacing: number;
    fee: number;
    block: number;
}
export interface Profcalcs {
    singleProfit: bigint;
    flashProfit: bigint;
}
export interface Valid3Pool {
    poolID: string;
    token0: string;
    token1: string;
    tickSpacing: number;
    fee: number;
    block: number;
}

export interface V3Matches {
    exchangeA: string;
    exchangeB: string;
    matches: Match3Pools[];
}

export interface ERC20token {
    id: string;
    symbol: string;
    decimals: number;
}
export interface Match3Pools {
    ticker: string;
    pool0: PoolInfo;
    pool1: PoolInfo;
    token0: ERC20token;
    token1: ERC20token;
}

export interface ReservesData {
    reserveIn: bigint;
    reserveOut: bigint;
    reserveInBN: BN;
    reserveOutBN: BN;
    blockTimestampLast: number;
}

export interface FactoryPool {
    exchange: string;
    factoryID: string;
    routerID: string;
    pairs: Pair[];
}
export interface PoolsV3 {
    ticker: string;
    poolA_id: string;
    poolB_id: string;
    token0: {
        symbol: string;
        id: string;
        decimals: number;
    };
    token1: {
        symbol: string;
        id: string;
        decimals: number;
    };
    feeTier: number;
}

export interface ToWMATICPool {
    ticker: string;
    tokenIn: { id: string; decimals: number; symbol: string };
    tokenOut: { id: string; decimals: number; symbol: string };
    id: string;
    exchange: string;
    reserves: {
        reserve0: bigint;
        reserve0BN: BN;
        reserve1: bigint;
        reserve1BN: BN;
    };
    liquidity: bigint;
}

export interface GasPool {
    ticker: string;
    address: string;
    liquidity: bigint;
}
export interface swap {
    amount0Out: bigint;
    amount1Out: bigint;
    to: string;
    data: string;
}

export interface Repays {
    single: bigint;
    flashSingle: bigint;
    flashMulti: bigint;
}
export interface V3Repays {
    getAmountsOut: bigint;
    getAmountsIn: bigint;
    repay: bigint;
}

export interface V2POOLS {
    ticker: string;
    token0symbol: string;
    token1symbol: string;
    pairID: string;
    token0: string;
    dec0: string;
    token1: string;
    dec1: string;
    v2apoolID: string;
    v2aprice0: string;
    v2aprice1: string;
    v2bpoolID: string;
    v2bprice0: string;
    v2bprice1: string;
}

export interface V3POOLS {}

export interface HiLo {
    higher: BN;
    lower: BN;
}

export interface Difference {
    difference: BN;
    differencePercent: BN;
}

export interface GasData {
    gasEstimate: bigint;
    gasPrice: bigint;
    maxFee: bigint;
    maxPriorityFee: bigint;
}

export interface PolygonGasData {
    safeLow: {
        maxPriorityFee: number;
        maxFee: number;
    };
    standard: {
        maxPriorityFee: number;
        maxFee: number;
    };
    fast: {
        maxPriorityFee: number;
        maxFee: number;
    };
    estimatedBaseFee: number;
    blockTime: number;
    blockNumber: Promise<number>;
}

export interface GAS {
    gasEstimate: bigint;
    tested: boolean;
    gasPrice: bigint;
    maxFee: bigint;
    maxPriorityFee: bigint;
}

export interface V3FlashParams {
    token0: string;
    token1: string;
    amount0: bigint;
    amount1: bigint;
    fee: number;
    target: string;
    deadline: number;
    sqrtPriceLimitX96: bigint;
    maxFlashSwapFee: bigint;
    flashFee: bigint;
    uniswapV3Pool1: string;
    uniswapV3PoolKey1: string;
    uniswapV3Fee1: number;
    uniswapV3TickLower1: number;
    uniswapV3TickUpper1: number;
    uniswapV3Pool2: string;
    uniswapV3PoolKey2: string;
    uniswapV3Fee2: number;
    uniswapV3TickLower2: number;
    uniswapV3TickUpper2: number;
}

export interface BoolTrade {
    ID: string;
    pending: boolean;
    block: number;
    direction: string;
    type: string;
    ticker: string;
    tokenIn: Token;
    tokenOut: Token;
    flash: Contract;
    tradeSizes: Sizes;
    wallet: {
        token0Balance: bigint;
        token1Balance: bigint;
        maticBalance: bigint;
    };
    loanPool: {
        exchange: string;
        factory: Contract;
        router: Contract;
        pool: Contract;
        reserveIn: bigint;
        reserveInBN: BN;
        reserveOut: bigint;
        reserveOutBN: BN;
        priceIn: string;
        priceOut: string;
        repays: Repays;
        amountRepay: bigint;
    };
    target: {
        exchange: string;
        factory: Contract;
        router: Contract;
        pool: Contract;
        reserveIn: bigint;
        reserveInBN: BN;
        reserveOut: bigint;
        reserveOutBN: BN;
        priceIn: string;
        priceOut: string;
    };
    quotes: FinalQuotes;
    gas: GasData;
    k: K;
    differenceTokenOut: string;
    differencePercent: string;
    profits: TradeProfit;
}
export interface Sizes {
    pool0: {
        token0: {
            size: bigint;
            sizeBN: BN;
        };
    };
    pool1: {
        token1: {
            size: bigint;
            sizeBN: BN;
        };
    };
}

export interface TradeGas {
    gasData: GasData;
}

export interface TradeProfit {
    tokenProfit: bigint;
    WMATICProfit: bigint;
}

export interface FinalQuotes {
    target: {
        token0Out: bigint;
        token1Out: bigint;
    };
    loanPool: {
        token0Out: bigint;
        token1Out: bigint;
    };
}

export interface Quotes {
    target: {
        token0Out: bigint;
        token1Out: bigint;
        flashToken0Out: bigint;
        flashToken1Out: bigint;
    };
    loanPool: {
        token0Out: bigint;
        token1Out: bigint;
        flashToken0Out: bigint;
        flashToken1Out: bigint;
    };
}
