import { ethers } from "ethers";
import { wallet, provider } from "../../../../constants/provider";
import { logger } from "../../../../constants/logger";

export async function sendTx(tx: any): Promise<ethers.TransactionResponse | undefined> {
    try {
        // return undefined
        let signedTx = await wallet.signTransaction(tx);
        let txResponse = await provider.broadcastTransaction(signedTx);
        await txResponse.wait(30);
        console.log(
            "Tx sent. txHash: " +
                txResponse.hash +
                " Awaiting confirmation. Confirmations: " +
                txResponse.confirmations,
        );
        if (txResponse.blockHash != null) {
            console.log("Transaction confirming. Block Hash: " + txResponse.blockHash);
            return txResponse;
        } else {
            console.log("[sendTx(Tx)]: Transaction failed with txResponse: " + txResponse);
            return txResponse;
        }
    } catch (error: any) {
        if (error.message.includes("already known")) {
            logger.info("[sendTX(tx)]: Transaction failed: Already Known");
            return undefined;
        } else {
            logger.info(
                "[sendTX(tx)]: Transaction failed without txResponse. Error: " + error.message,
            );
            return undefined;
        }
    }
}
