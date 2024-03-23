import { BoolTrade, GAS, GasData } from "../../../../constants/interfaces";
import { ownerID } from "../../../../constants/provider";
import { tradeLogs } from "../tradeLog";
import { logger } from "../../../../constants/logger";
import { fu, pu } from "../../../modules/convertBN";
import { signer } from "../../../../constants/provider";
import { swapSingle, swapSingleID } from "../../../../constants/environment";
import { debugAmounts } from "../../../../test/debugAmounts";
import { abi as IERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json";
import { abi as IUniswapV2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Pair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { walletBal } from "../tools/walletBal";
// import { fixEstimateGas } from "../../../../test/fixEstimateGas";
import { debug } from "console";
import { ethers } from "hardhat";
import { pendingTransactions } from "../../control";
import { MaxInt256 } from "ethers";

export async function safetyChecks(trade: BoolTrade): Promise<boolean> {
    const p = trade.params;

    let swapApproval: bigint = await trade.tokenIn.contract.allowance(
        ownerID,
        swapSingleID,
    );
    let routerApproval: bigint = await trade.tokenIn.contract.allowance(
        ownerID,
        await trade.target.router.getAddress(),
    );

    if (p.amountOutB < p.tradeSize) {
        logger.error(
            "AmountOutB in TokenIn on LoanPool lower than tradeSize. (no profit)",
        );
        return false;
    }

    // const profit = p.amountOutA - trade.quotes.loanPool.tokenOutOut;

    // // logger.info(
    // //     "Profit in tokenIn: " + fu(profit, trade.tokenOut.data.decimals),
    // //     trade.tokenOut.data.symbol,
    // // );

    const bal = await walletBal(trade.tokenIn.data, trade.tokenOut.data);
    // let walletBalance = {
    //     walletID: await signer.getAddress(),
    //     tokenIn: fu(bal.tokenIn, trade.tokenIn.data.decimals),
    //     tokenOut: fu(bal.tokenOut, trade.tokenOut.data.decimals),
    //     gas: fu(bal.gas, 18),
    // };

    if (bal.tokenIn < trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
        logger.error(
            "TokenIn balance too low for trade: ",
            "tokenIn Balance: ",
            fu(bal.tokenIn, trade.tokenIn.data.decimals),
            trade.tokenIn.data.symbol,
            "tokenIn tradeSize: ",
            fu(
                trade.tradeSizes.loanPool.tradeSizeTokenIn.size,
                trade.tokenIn.data.decimals,
            ),
            trade.tokenIn.data.symbol,
        );
        return false;
    }

    if (swapApproval < p.tradeSize) {
        logger.error(
            "swapSingle allowance too low for trade. swapApproval: ",
            fu(swapApproval, trade.tokenIn.data.decimals),
        );
        return false;
    }
    // }
    if (routerApproval < p.tradeSize) {
        logger.error(
            "RouterA allowance too low for trade: routerApproval: ",
            fu(routerApproval, trade.tokenIn.data.decimals),
        );
        return false;
    }

    if (pendingTransactions[trade.ID] == true) {
        logger.info("Pending gasEstimate. Skipping gasEstimate.");
        return false;
    }

    return true;
}
