// import {  utils as u } from "ethers";
// import { Amounts, FactoryPair, GasData, Pair, Profit, K } from "../../../constants/interfaces";
// import { abi as IFactory } from '@uniswap/v2-core/build/IUniswapV2Factory.json';
// import { abi as IRouter } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
// import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
// import { wallet, flashMulti } from "../../../constants/contract";
// import { Contract } from "@ethersproject/contracts";
// import { Prices } from "./prices";
// import { getK } from "./getK";
// import { BoolTrade } from "../../../constants/interfaces"
// import { getAmountsIn, getAmountsOut } from "./getAmountsIOLocal";
// /**
//  * @description
//  * Class to determine trade direction
//  * returns a BoolTrade object, which fills out all params needed for a trade.
//   *
// */

// /*
// I prefer deciding trade based on profit, but it migth be necessary to decide based on price.
// The technique for using profit would be to calc the repay, then work out profit, then use that to determine direction, et voila.
// however, this works for now.
// let A: bigint = this.amounts0.amountOutJS.sub(amountRepayB);
// let B: bigint = this.amounts1.amountOutJS.sub(amountRepayA);
//  */
// export class Trade {
//     trade: BoolTrade | undefined;
//     pair: FactoryPair;
//     match: Pair;
//     price0: Prices;
//     price1: Prices;
//     amounts0: Amounts;
//     amounts1: Amounts;
//     gasData: GasData;

//     constructor(pair: FactoryPair, match: Pair, price0: Prices, price1: Prices, amounts0: Amounts, amounts1: Amounts, gasData: GasData) {
//         this.pair = pair;
//         this.price0 = price0;
//         this.price1 = price1;
//         this.match = match;
//         this.amounts0 = amounts0
//         this.amounts1 = amounts1;
//         this.gasData = gasData;
//     }

//     // Get repayment amount for the loanPool
//     async getRepayMulti(tradeSize: bigint, reserveIn: bigint, reserveOut: bigint): Promise<bigint> {
//         const amountRepay = await getAmountsIn(tradeSize, reserveIn, reserveOut); // result must be token1
//         return amountRepay; //in token1
//     }

//     // Get repayment amount for the loanPool
//     async getRepayDirect(tradeSize: bigint): Promise<bigint> {
//         const repay = tradeSize.mul(1003009027).div(1000000000);
//         return repay; //in token0
//     }

//     async getTrade(): Promise<BoolTrade> {

//         const A = this.price0.priceOutBN;
//         const B = this.price1.priceOutBN;

//         const direction = A.lt(B) ? "A" : B.lt(A) ? "B" : "DIRECTIONAL AMBIGUITY ERROR";

//         var trade: BoolTrade = {
//             direction: direction,
//             type: "error",
//             ticker: this.match.token0.symbol + "/" + this.match.token1.symbol,
//             tokenIn: this.match.token0,
//             tokenOut: this.match.token1,
//             flash: flashMulti,
//             loanPool: {
//                 exchange: A ? this.pair.exchangeB : this.pair.exchangeA,
//                 factory: A ? new Contract(this.pair.factoryB_id, IFactory, wallet) : new Contract(this.pair.factoryA_id, IFactory, wallet),
//                 router: A ? new Contract(this.pair.routerB_id, IRouter, wallet) : new Contract(this.pair.routerA_id, IRouter, wallet),
//                 pool: A ? new Contract(this.match.poolB_id, IPair, wallet) : new Contract(this.match.poolA_id, IPair, wallet),
//                 reserveIn: A ? this.price1.reserves.reserveIn : this.price0.reserves.reserveIn,
//                 reserveOut: A ? this.price1.reserves.reserveOut : this.price0.reserves.reserveOut,
//                 priceIn: A ? this.price1.priceInBN.toFixed(this.match.token0.decimals) : this.price0.priceInBN.toFixed(this.match.token0.decimals),
//                 priceOut: A ? this.price1.priceOutBN.toFixed(this.match.token1.decimals) : this.price0.priceOutBN.toFixed(this.match.token1.decimals),
//                 amountOut: 0n,
//             },
//             target: {
//                 exchange: A ? this.pair.0u655 : this.pair.exchangeB,
//                 factory: A ? new Contract(this.pair.factoryA_id, IFactory, wallet) : new Contract(this.pair.factoryB_id, IFactory, wallet),
//                 router: A ? new Contract(this.pair.routerA_id, IRouter, wallet) : new Contract(this.pair.routerB_id, IRouter, wallet),
//                 pool: A ? new Contract(this.match.poolA_id, IPair, wallet) : new Contract(this.match.poolB_id, IPair, wallet),
//                 reserveIn: A ? this.price0.reserves.reserveIn : this.price1.reserves.reserveIn,
//                 reserveOut: A ? this.price0.reserves.reserveOut : this.price1.reserves.reserveOut,
//                 priceIn: A ? this.price0.priceInBN.toFixed(this.match.token0.decimals) : this.price1.priceInBN.toFixed(this.match.token0.decimals),
//                 priceOut: A ? this.price0.priceOutBN.toFixed(this.match.token1.decimals) : this.price1.priceOutBN.toFixed(this.match.token1.decimals),
//                 tradeSize: A ? //this.amounts0.tradeSize : this.amounts1.tradeSize,
//                     (this.amounts0.tradeSize.lt(this.price1.reserves.reserveIn) ? this.amounts0.tradeSize : this.price1.reserves.reserveIn) :
//                     (this.amounts1.tradeSize.lt(this.price0.reserves.reserveIn) ? this.amounts1.tradeSize : this.price0.reserves.reserveIn),
//                 amountOut: A ? this.amounts0.amountOutJS : this.amounts1.amountOutJS,
//             },
//             k: {
//                 uniswapKPre: 0n,
//                 uniswapKPost: 0n,
//                 uniswapKPositive: false,
//             },
//             gasData: this.gasData,
//             amountRepay: 0n, // decided based on direct v multi trade returns
//             profit: 0n
//         };

//         if (trade.target.tradeSize.eq(0)) {
//             console.log("Trade size is 0, no trade possible: " + trade.ticker)
//             return trade;
//         }

//         //We need the amountOut of tokenIn for directRepay from loanpool to see now much of token0 loan can be repaid, if the trade is direct.
//         trade.loanPool.amountOut = await getAmountsOut(
//             trade.target.amountOut,
//             trade.loanPool.reserveOut,
//             trade.loanPool.reserveIn);

//         const multiRepay = await this.getRepayMulti(
//             trade.target.tradeSize,
//             trade.loanPool.reserveOut,
//             trade.loanPool.reserveIn
//         ) //in token1

//         const directRepay = await this.getRepayDirect(
//             trade.target.tradeSize,
//         ) //in token0

//         const profitMulti = trade.target.amountOut.sub(multiRepay)
//         const profitDirect = trade.loanPool.amountOut.sub(directRepay)

//         trade.type = profitMulti.gt(profitDirect) ? "multi" : "direct";

//         trade.amountRepay = trade.type === "multi" ? multiRepay : directRepay;

//         trade.profit = trade.type === "multi" ? profitMulti : profitDirect;

//         trade.k = await getK(trade);

//         return trade;
//     }
// }

