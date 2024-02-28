import { BigNumber as BN } from "bignumber.js";
import { BoolTrade } from "../../../../constants/interfaces";

export class AmountsBN {
    trade: BoolTrade;
    constructor(trade: BoolTrade) {
        this.trade = trade;
    }

    async getAmountOut(n: BN, reserveIn: BN, reserveOut: BN): Promise<BN> {
        const amountInWithFee = n.multipliedBy(BN(0.97));
        const numerator = amountInWithFee.multipliedBy(reserveOut);
        const denominator = reserveIn.plus(amountInWithFee);
        return numerator.div(denominator);
    }

    async getAmountIn(n: BN, reserveIn: BN, reserveOut: BN): Promise<BN> {
        if (n.lte(BN(0))) {
            console.log("getAmountsIOBN: Invalid amountIn");
            return BN(0);
        }
        if (reserveIn.lte(BN(0)) || reserveOut.lte(BN(0))) {
            console.log("getAmountsIOBN: Invalid reserves");
            return BN(0);
        }
        const numerator = reserveIn.multipliedBy(n);
        const denominator = reserveOut.minus(n).multipliedBy(BN(0.97));
        return numerator.div(denominator);
    }

    async getAmountsOut(n: BN, path: string[]): Promise<BN[]> {
        if (path.length < 2) {
            console.log("getAmountsIOBN: Invalid path");
            return [BN(0)];
        }
        let amounts: BN[] = [];
        amounts[0] = n;
        for (let i = 0; i < path.length - 1; i++) {
            amounts[i + 1] = await this.getAmountOut(
                amounts[i],
                this.trade.target.reserveInBN,
                this.trade.target.reserveOutBN,
            );
        }
        return Promise.resolve(amounts);
    }

    async getAmountsIn(n: BN, path: string[]): Promise<BN[]> {
        if (path.length < 2) {
            console.log("getAmountsIOBN: Invalid path");
            return [BN(0)];
        }
        let amounts: BN[] = [];
        amounts[amounts.length - 1] = n;
        for (let i = path.length - 1; i > 0; i--) {
            amounts[i - 1] = await this.getAmountIn(
                amounts[i],
                this.trade.target.reserveInBN,
                this.trade.target.reserveOutBN,
            );
        }
        return Promise.resolve(amounts);
    }
}

// // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
// function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
//     require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
//     require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
//     uint numerator = reserveIn.mul(amountOut).mul(1000);
//     uint denominator = reserveOut.sub(amountOut).mul(997);
//     amountIn = (numerator / denominator).add(1);
// }

// // performs chained getAmountIn calculations on any number of pairs
// function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
//     require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
//     amounts = new uint[](path.length);
//     amounts[amounts.length - 1] = amountOut;
//     for (uint i = path.length - 1; i > 0; i--) {
//         (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
//         amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
//     }
// }

// given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
// function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
//     require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
//     require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
//     uint amountInWithFee = amountIn.mul(997);
//     uint numerator = amountInWithFee.mul(reserveOut);
//     uint denominator = reserveIn.mul(1000).add(amountInWithFee);
//     amountOut = numerator / denominator;
// }

// // performs chained getAmountOut calculations on any number of pairs
// function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
//     require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
//     amounts = new uint[](path.length);
//     amounts[0] = amountIn;
//     for (uint i; i < path.length - 1; i++) {
//         (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
//         amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
//     }
// }

// // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
// function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
//     require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
//     require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
//     uint numerator = reserveIn.mul(amountOut).mul(1000);
//     uint denominator = reserveOut.sub(amountOut).mul(997);
//     amountIn = (numerator / denominator).add(1);
// }

// // performs chained getAmountIn calculations on any number of pairs
// function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
//     require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
//     amounts = new uint[](path.length);
//     amounts[amounts.length - 1] = amountOut;
//     for (uint i = path.length - 1; i > 0; i--) {
//         (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
//         amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
//     }
// }
