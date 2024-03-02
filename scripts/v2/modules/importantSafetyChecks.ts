import { dataLength, ethers } from "ethers";
import { BoolTrade, swap } from "../../../constants/interfaces";
import { tradeComparator } from "@cryptoalgebra/integral-sdk";

// import { BigNumber as BN } from 'bignumber.js'

//Safety checks which should be called on target pool before trade.

export async function importantSafetyChecks(trade: BoolTrade): Promise<BoolTrade> {
    // const swap: swap = {
    //     amount0Out: trade.tradeSizes.pool0.token0.size,
    //     amount1Out: 0n,
    //     to: await trade.target.pool.getAddress(),
    //     data: "none",
    // };

    if (trade.tradeSizes.pool0.token0.size > trade.target.reserveIn) {
        trade.type = "filtered: trade.tradeSizes.pool0.token0.size > trade.target.reserveIn";
    }
    if (trade.quotes.target.token1Out > trade.target.reserveOut) {
        trade.type = "filtered:trade.quotes.target.token1Out > trade.target.reserveOut";
    }
    if (trade.type.includes("flash") && trade.k.uniswapKPositive === false) {
        trade.type = "filtered: K";
    }
    // let balance0 = trade.target.reserveIn;
    // let balance1 = trade.target.reserveOut;
    // const postTradeReservesIn =
    //     balance0 > trade.target.reserveIn - trade.tradeSizes.pool0.token0.size
    //         ? balance0 - (trade.target.reserveIn - trade.tradeSizes.pool0.token0.size)
    //         : 0n;
    // const postTradeReservesOut =
    //     balance1 > trade.target.reserveOut - trade.quotes.target.token1Out
    //         ? balance1 - (trade.target.reserveOut - trade.quotes.target.token1Out)
    //         : 0n;
    // if (postTradeReservesIn < 0) {
    //     trade.type = "filtered: postTradeReservesIn < 0 (INSUFFICIENT_INPUT_AMOUNT)";
    //     console.log(
    //         "INSUFFICIENT INPUT AMOUNT",
    //         postTradeReservesIn,
    //         trade.ticker,
    //         " ",
    //         trade.target.exchange,
    //     );
    // }
    // if (postTradeReservesOut < 0) {
    //     trade.type = "filtered: postTradeReservesOut < 0 (INSUFFICIENT_INPUT_AMOUNT)";
    //     console.log(
    //         "INSUFFICIENT INPUT AMOUNT",
    //         postTradeReservesOut,
    //         trade.ticker,
    //         " ",
    //         trade.target.exchange,
    //     );
    // }
    // const balance0Adjusted = balance0 * 1000n - postTradeReservesIn * 1n;
    // const balance1Adjusted = balance1 * 1000n - postTradeReservesOut * 1n;
    // const k = {
    //     kPost: balance0Adjusted * balance1Adjusted,
    //     rPost: trade.target.reserveIn * trade.target.reserveOut * 1000n ** 2n,
    // };
    // if (k.kPost < k.rPost) {
    //     trade.type = "filtered: K";
    //     // console.log("No Trade: K: ", trade.ticker, " ", trade.target.exchange);
    //     // console.log(k);
    // }
    return trade;
}

//   // this low-level function should be called from a contract which performs important safety checks
//     // function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external lock {
//         // require(amount0Out > 0 || amount1Out > 0, 'Jetswap: INSUFFICIENT_OUTPUT_AMOUNT');
//         // (uint112 _reserve0, uint112 _reserve1,) = getReserves(); // gas savings
//         // require(amount0Out < _reserve0 && amount1Out < _reserve1, 'Jetswap: INSUFFICIENT_LIQUIDITY');

//         // uint balance0;
//         // uint balance1;
//         { // scope for _token{0,1}, avoids stack too deep errors
//         // address _token0 = token0;
//         // address _token1 = token1;
//         // require(to != _token0 && to != _token1, 'Jetswap: INVALID_TO');?
//         // if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
//         // if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
//         // if (data.length > 0) IJetswapCallee(to).jetswapCall(msg.sender, amount0Out, amount1Out, data);
//         // balance0 = IERC20(_token0).balanceOf(address(this));
//         // balance1 = IERC20(_token1).balanceOf(address(this));
//         }
//         // uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
//         // uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
//         // require(amount0In > 0 || amount1In > 0, 'Jetswap: INSUFFICIENT_INPUT_AMOUNT');
//         { // scope for reserve{0,1}Adjusted, avoids stack too deep errors
//         // uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(1));
//         // uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(1));
//         // require(balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000**2), 'Jetswap: K');
//         // }
