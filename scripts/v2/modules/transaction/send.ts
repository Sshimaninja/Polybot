import { BoolTrade, TxData, V2Tx, TxGas } from "../../../../constants/interfaces";
import { sendTx } from "./sendTx";
import { pu, fu, BN2BigInt } from "../../../modules/convertBN";
import { slip } from "../../../../constants/environment";
import { logger } from "../../../../constants/logger";
export async function send(trade: BoolTrade): Promise<TxData> {
    // let slippageJS = BN2BigInt(slip, 18);
    // let amountOut = trade.target.amountOut - trade.target.amountOut * slippageJS;
    // POSSIBLE REVERT CONDITIONS:
    // amountOut too high (calculated without slip)
    // amountRepay too low (calculated without subtracting extra for slip)
    // DEBUG:

    const txLog = {
        loanFactory: await trade.loanPool.factory.getAddress(),
        loanRouter: await trade.loanPool.router.getAddress(),
        targetRouter: await trade.target.router.getAddress(),
        tokenInId: trade.tokenIn.id,
        tokenOutId: trade.tokenOut.id,
        tradeSize: trade.target.tradeSize,
        amountOut: trade.target.amountOut,
        repay: trade.loanPool.amountRepay,
    };
    logger.info("====TRANSACTION PARAMS=== ");
    logger.info(txLog);

    let tx: V2Tx = await trade.flash.flashSwap(
        trade.loanPool.factory,
        trade.loanPool.router,
        trade.target.router,
        trade.tokenIn.id,
        trade.tokenOut.id,
        trade.target.tradeSize,
        trade.target.amountOut,
        trade.loanPool.amountRepay,
    );
    try {
        const t = await sendTx(tx);
        if (t !== undefined) {
            await t.wait(30);
            return {
                txResponse: t,
                pendingID: trade.ID,
            };
        } else {
            return {
                txResponse: t,
                pendingID: null,
            };
        }
    } catch (error: any) {
        // if (error.message.includes("transaction underpriced")) {
        // 	console.log("[send.ts]: TRANSACTION UNDERPRICED " + error.message)
        // 	gasObj = {
        // 		type: 2,
        // 		maxFeePerGas: gasObj.maxFeePerGas + 10,
        // 		maxPriorityFeePerGas: gasObj.maxPriorityFeePerGas + 10,
        // 		gasLimit: gasObj.gasLimit.add(BigInt(10000)),
        // 	}
        // 	const newTx = await sendTx(tx)
        // 	console.log("Retrying transaction with new gas price: " + gasObj.maxFeePerGas)
        // 	// Wait for the new transaction to be confirmed
        // 	if (newTx !== undefined) {
        // 		await newTx.wait(30);
        // 		return {
        // 			txResponse: newTx,
        // 			pendingID: trade.ID,
        // 		}
        // } else {
        console.log("[send.ts]:Transaction send(tx) failed. Error: " + error.message);
        // return {
        // 	txResponse: newTx,
        // 	pendingID: null,
        // }
    }
    // }
    return {
        txResponse: undefined,
        pendingID: null,
    };
}
