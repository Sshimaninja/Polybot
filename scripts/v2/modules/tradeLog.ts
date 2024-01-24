
import { BoolTrade } from "../../../constants/interfaces";
import { BigInt2BN, fu } from "../../modules/convertBN";


export async function tradeLogs(trade: BoolTrade): Promise<any> {
	try {
		const data = {
			id: trade.ID,
			block: trade.block,
			trade: trade.type,
			ticker: trade.ticker,
			direction: trade.direction,
			tradeSize: fu(trade.target.tradeSize, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
			loanPool: {
				exchange: trade.loanPool.exchange,
				priceIn: trade.loanPool.priceIn,
				priceOut: trade.loanPool.priceOut,
				reservesIn: fu(trade.loanPool.reserveIn, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
				reservesOut: fu(trade.loanPool.reserveOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
				repaysObj:
				{
					direct: fu(trade.loanPool.repays.direct, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
					directInTokenOut: fu(trade.loanPool.repays.directInTokenOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
					simpleMulti: fu(trade.loanPool.repays.simpleMulti, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
					getAmountsOut: fu(trade.loanPool.repays.getAmountsOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
					getAmountsIn: fu(trade.loanPool.repays.getAmountsIn, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
				},
				amountOut: fu(trade.loanPool.amountOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
				amountOutToken0for1: fu(trade.loanPool.amountOutToken0for1, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
				amountRepay: trade.type === "multi" ? fu(trade.loanPool.amountRepay, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol : trade.type === "direct" ? fu(trade.loanPool.amountRepay, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol : "error",
			},
			target: {
				exchange: trade.target.exchange,
				priceIn: trade.target.priceIn,
				priceOut: trade.target.priceOut,
				reservesIn: fu(trade.target.reserveIn, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
				reservesOut: fu(trade.target.reserveOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
				amountOutToken0for1: fu(trade.target.amountOutToken0for1, trade.tokenIn.decimals) + " " + trade.tokenIn.symbol,
				amountOut: fu(trade.target.amountOut, trade.tokenOut.decimals) + " " + trade.tokenOut.symbol,
			},
			result: {
				uniswapkPreT: trade.k.uniswapKPre > 0n ? trade.k.uniswapKPre.toString() : 0,
				uniswapkPosT: trade.k.uniswapKPost > 0n ? trade.k.uniswapKPost.toString() : 0,
				uniswapKPositive: trade.k.uniswapKPositive,
				// loanCostPercent: fu((trade.loanPool.amountOut.div(trade.amountRepay)).mul(100), trade.tokenOut.decimals),
				profit: fu(trade.profit, (trade.tokenOut.decimals)) + " " + (trade.tokenOut.symbol),
				profperc: fu(trade.profitPercent, (trade.tokenOut.decimals)) + "%",
			}
		}


		return data
	} catch (error: any) {
		console.log("Error in tradeLog.ts: " + error.message);
		return { data: "error" }
	}
}