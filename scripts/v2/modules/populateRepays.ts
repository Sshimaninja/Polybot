import { BigNumber as BN } from "bignumber.js";
import { Profcalcs, Repays, BoolTrade } from "../../../constants/interfaces";
import { AmountConverter } from "./amountConverter";
import { getAmountsIn, getAmountsOut } from "./getAmountsIOLocal";
import { BigInt2BN, BN2BigInt, fu, pu } from "../../modules/convertBN";


export class PopulateRepays {
	trade: BoolTrade;
	calc: AmountConverter;
	repays: Repays;

	constructor(trade: BoolTrade, calc: AmountConverter) {
		this.trade = trade;
		this.calc = calc;
		this.repays = {
			direct: 0n,
			directInTokenOut: 0n,
			simpleMulti: 0n,
			getAmountsOut: 0n,
			getAmountsIn: 0n,
			repay: 0n,
		};
	}


	/*
	I have to send back only the amount of token1 needed to repay the amount of token0 I was loaned.
	Thus I need to calculate the exact amount of token1 that tradeSize in tokenOut represents on loanPool, 
	and subtract it from recipient.amountOut before sending it back
	*/
	// const postReserveIn = this.trade.loanPool.reserveIn.sub(this.trade.target.tradeSize); // I think this is only relevant for uniswap K calcs				
	async getRepays(): Promise<Repays> {

		const repayDirect = await this.calc.addFee(this.trade.target.tradeSize);
		// const directRepayLoanPoolInTokenOut = await getAmountsOut(
		// 	this.trade.target.tradeSize,
		// 	this.trade.loanPool.reserveIn, // 
		// 	this.trade.loanPool.reserveOut
		// );

		//get loanPool conversion of tradeSize in terms of tokenOut
		const repayDirectBN = BigInt2BN(repayDirect, this.trade.tokenIn.decimals);
		const directRepayLoanPoolInTokenOutBN = repayDirectBN.multipliedBy(BN(this.trade.loanPool.priceOut));
		const directRepayLoanPoolInTokenOut = BN2BigInt(directRepayLoanPoolInTokenOutBN, this.trade.tokenOut.decimals);
		// const directRepayLoanPoolInTokenOutWithFee = await this.calc.addFee(directRepayLoanPoolInTokenOut);


		const ts = BigInt2BN(this.trade.target.tradeSize, this.trade.tokenIn.decimals)
		const tradeSizeInTermsOfTokenOutOnLoanPool = ts.multipliedBy(BN(this.trade.loanPool.priceOut))

		const simpleBN = tradeSizeInTermsOfTokenOutOnLoanPool.multipliedBy(1.003) // 0.3% fee
		const simple = BN2BigInt(simpleBN, this.trade.tokenOut.decimals)

		// this.trade.target.tradeSize
		// 	.mul(this.trade.loanPool.reserveOut.div(this.trade.loanPool.reserveIn))// will never work with ethers.js BigInt because of rounding down.
		// const simple = await calc.addFee(tradeSizeInTermsOfTokenOutOnLoanPool)

		const repayByGetAmountsOut = await getAmountsOut(// getAmountsOut is used here, but you can also use getAmountsIn, as they can achieve similar results by switching reserves.
			this.trade.target.tradeSize,
			this.trade.loanPool.reserveIn,
			this.trade.loanPool.reserveOut // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
		)

		const repayByGetAmountsIn = await getAmountsIn( //Will output tokenIn.
			this.trade.target.tradeSize,
			this.trade.loanPool.reserveOut, // <= Will return in terms of this reserve. If this is reserveIn, will return in terms of tokenIn. If this is reserveOut, will return in terms of tokenOut.
			this.trade.loanPool.reserveIn
		)

		const repays: Repays = {
			direct: repayDirect,
			directInTokenOut: directRepayLoanPoolInTokenOut,
			simpleMulti: simple,
			getAmountsOut: repayByGetAmountsOut,
			getAmountsIn: repayByGetAmountsIn,
			//SET YOUR CHOICE HERE:
			//getAmountsOut is wrong and forces a trade, but it is okay for testing at least.
			//getAmountsIn is the recommended choice, but it does not yield trades often enough to test.
			repay: repayByGetAmountsOut,
		}
		return repays;
	}

}
