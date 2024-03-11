import { BoolTrade } from "../../../../constants/interfaces";

interface WalletTradeSizes {
    tokenIn: bigint;
    tokenOut: bigint;
}
export async function walletTradeSize(trade: BoolTrade): Promise<WalletTradeSizes> {
    let walletTradeSizes: WalletTradeSizes = {
        tokenIn: trade.wallet.tokenInBalance,
        tokenOut: trade.wallet.tokenOutBalance,
    };
    // let funds = trade.wallet.tokenInBalance;

    if (trade.wallet.tokenInBalance > trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
        walletTradeSizes.tokenIn = trade.tradeSizes.loanPool.tradeSizeTokenIn.size;
    }

    if (trade.wallet.tokenOutBalance > trade.tradeSizes.target.tradeSizeTokenOut.size) {
        walletTradeSizes.tokenOut = trade.tradeSizes.target.tradeSizeTokenOut.size;
    }

    walletTradeSizes = {
        tokenIn: walletTradeSizes.tokenIn,
        tokenOut: walletTradeSizes.tokenOut,
    };
    return walletTradeSizes;
}
