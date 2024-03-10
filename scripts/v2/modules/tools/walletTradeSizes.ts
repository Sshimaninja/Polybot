import { BoolTrade } from "../../../../constants/interfaces";

interface WalletTradeSizes {
    token0: bigint;
    token1: bigint;
}
export async function walletTradeSize(trade: BoolTrade): Promise<WalletTradeSizes> {
    let walletTradeSizes: WalletTradeSizes = {
        token0: trade.wallet.token0Balance,
        token1: trade.wallet.token1Balance,
    };
    // let funds = trade.wallet.token0Balance;

    if (trade.wallet.token0Balance > trade.tradeSizes.loanPool.tradeSizeTokenIn.size) {
        walletTradeSizes.token0 = trade.tradeSizes.loanPool.tradeSizeTokenIn.size;
    }

    if (trade.wallet.token1Balance > trade.tradeSizes.target.tradeSizeTokenOut.size) {
        walletTradeSizes.token1 = trade.tradeSizes.target.tradeSizeTokenOut.size;
    }

    walletTradeSizes = {
        token0: walletTradeSizes.token0,
        token1: walletTradeSizes.token1,
    };
    return walletTradeSizes;
}
