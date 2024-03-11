import { dataLength, ethers } from "ethers";
import { BoolTrade, swap } from "../../../constants/interfaces";
import { tradeComparator } from "@cryptoalgebra/integral-sdk";

// import { BigNumber as BN } from 'bignumber.js'

//Safety checks which should be called on target pool before trade.

export async function importantSafetyChecks(trade: BoolTrade): Promise<BoolTrade> {
    // const swap: swap = {
    //     amount0Out: trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
    //     amount1Out: 0n,
    //     to: await trade.target.pool.getAddress(),
    //     data: "none",
    // };
    if (trade.type.includes("flash")) {
        if (trade.tradeSizes.loanPool.tradeSizeTokenIn.size > trade.loanPool.reserveIn) {
            trade.type =
                "filtered flash: trade.tradeSizes.loanPool.tradeSizeTokenIn.size > trade.target.reserveIn";
        }
        if (trade.quotes.target.tokenOutOut > trade.target.reserveOut) {
            trade.type = "filteredflash: trade.quotes.target.tokenOutOut > trade.target.reserveOut";
        }
        if (trade.k.uniswapKPositive === false) {
            trade.type = "filtered flash: K";
        }
        // function safeTransferFrom(address token, address from, address to, uint value) internal {
        //     // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        //     (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        //     require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
        // }
    }
    if (trade.type === "single") {
        if (trade.tradeSizes.loanPool.tradeSizeTokenIn.size > trade.wallet.tokenInBalance) {
            trade.type =
                "filtered single: trade.tradeSizes.loanPool.tradeSizeTokenIn.size > trade.wallet.tokenInBalance";
        }
        if (trade.quotes.loanPool.tokenInOut > trade.loanPool.reserveIn) {
            trade.type =
                "filtered single: trade.quotes.target.tokenOutOut > trade.target.reserveOut";
        }
    }
    return trade;
}
