import { BoolTrade } from "../../../constants/interfaces";
import { Profit } from "../../../constants/interfaces";
import { fetchGasPrice } from "./fetchGasPrice";
import { getProfitInWMATIC } from "./getProfitInWmatic";
import { fu } from "../../modules/convertBN";
require("dotenv").config();
/**
 * Determines whether the profit is greater than the gas cost.
 * @param trade
 * @returns Profit{profit: string, gasEstimate: bigint, gasCost: bigint, gasPool: string}
 */
export async function gasVprofit(trade: BoolTrade): Promise<Profit> {
    let profit: Profit;
    {
        console.log(
            "[gasVprofit]: Trade: ",
            trade.type,
            trade.loanPool.exchange,
            ":",
            trade.target.exchange,
            " @ ",
            trade.ticker,
            " profitPercent: ",
            fu(trade.profitPercent, trade.tokenOut.decimals),
        );
        if (trade.direction == undefined) {
            console.log("Trade direction is undefined.");
            return (profit = {
                profit: "undefined",
                gasEstimate: 0n,
                gasCost: 0n,
                gasPool: "undefined",
                gas: {
                    gasEstimate: 0n,
                    tested: false,
                    gasPrice: 0n,
                    maxFee: 0n,
                    maxPriorityFee: 0n,
                },
            });
        } else {
            const prices = await fetchGasPrice(trade);

            if (prices.tested == true) {
                const profitinMatic = await getProfitInWMATIC(trade);
                if (profitinMatic != undefined && profitinMatic.gasPool != undefined) {
                    if (profitinMatic.profitInWMATIC > 0n) {
                        profit = {
                            profit: fu(profitinMatic.profitInWMATIC, 18),
                            gasEstimate: prices.gasEstimate,
                            gasCost: prices.gasPrice,
                            gasPool: await profitinMatic.gasPool.getAddress(),
                            gas: prices,
                        };
                        console.log(
                            "Possible trade: " + trade.ticker + " Gas Estimate: ",
                            prices.gasEstimate.toString(),
                            "Gas Price: ",
                            fu(prices.gasPrice, 18),
                        );
                        // console.log("Profit: ", profit)
                        return profit;
                    }
                    if (profitinMatic.profitInWMATIC < 0n) {
                        console.log("Trade is negative.");
                        return (profit = {
                            profit: fu(profitinMatic.profitInWMATIC, 18),
                            gasEstimate: prices.gasEstimate,
                            gasCost: prices.gasPrice,
                            gasPool: "undefined",
                            gas: prices,
                        });
                    }
                } else if (profitinMatic == undefined) {
                    console.log("Profit in Matic is undefined.");
                    return (profit = {
                        profit: "undefined",
                        gasEstimate: 0n,
                        gasCost: 0n,
                        gasPool: "undefined",
                        gas: prices,
                    });
                }
            }
        }

        return (profit = {
            profit: "undefined",
            gasEstimate: 0n,
            gasCost: 0n,
            gasPool: "undefined",
            gas: {
                gasEstimate: 0n,
                tested: false,
                gasPrice: 0n,
                maxFee: 0n,
                maxPriorityFee: 0n,
            },
        });
    }
}
