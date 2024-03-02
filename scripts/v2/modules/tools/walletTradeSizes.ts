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

    if (trade.wallet.token0Balance > trade.tradeSizes.pool0.token0.size) {
        walletTradeSizes.token0 = trade.tradeSizes.pool0.token0.size;
    }

    if (trade.wallet.token1Balance > trade.tradeSizes.pool1.token1.size) {
        walletTradeSizes.token1 = trade.tradeSizes.pool1.token1.size;
    }

    walletTradeSizes = {
        token0: walletTradeSizes.token0,
        token1: walletTradeSizes.token1,
    };
    return walletTradeSizes;
}
