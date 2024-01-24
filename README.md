# TODO: Update to ES2020 BigInt

## ethers.parseUnits() example in BigInt:

	const baseValue = BigInt(10) ** BigInt(18);
	const humanReadableNumber = BigInt("10000");

	const result = humanReadableNumber * baseValue;

	console.log(result.toString()); // Print the result as a string



# Commands: 
Start v2 bot: 
	npm run bot2

Start v3 bot:
	npm run bot3

The following operation may be time consuming:
	Get new pairs for v2 :
		npm run get2

	Get new pairs for v3:
		npm run get3

	Match v2 pairs
		npm run match2
	
	Match v3 paris
		npm run match3

script -c "npx hardhat node" | tee output.txt

# Deploy Hardhat tests:

To create arb opportunity:
	npm run arbSim
	or
	npx hardhat run --network localhost test/arbSim.ts

To deploy test contracts on localhost hardhat polygon fork:
	npx hardhat run --network localhost scripts/deployFlashTest.ts;

Testing operations:
	Start the local Hardhat network with forking enabled.
	Run the arbSim.ts script to create the arbitrage opportunity.
	Run this bot on the local network.

# Output results to file:

run script to record hardhat output: 
	script -c "npx hardhat node" | grep -v "term-to-exclude" > output.txt
	
ex: exclude empty eth calls from hh results:
	script -c "npx hardhat node" | grep -vP "eth_call\s+Contract call:\s+<UnrecognizedContract>\s+From:\s+0x[a-fA-F0-9]{40}\s+To:\s+0x[a-fA-F0-9]{40}" > output.txt

# Deploy live to Polygon
	npx hardhat run --network [network] scripts/deployFlash.ts
	

# Notes:
I've moved smart contracts to a new repo because neither VSCode, nor Hardhat can handle multiple different versions of solidity docs and compilers, resulting in insane amounts of wasted time.

re: tradeSize
				// Would be good to have a strategy that takes into account the reserves of the pool and uses the min of the three below, but that adds a lot of complexity.
				
				Wrong/deprecated:
					// This strategy attempts to use the biggest tradeSize possible. 
					// It will use toPrice, despite high slippage, if slippage creates profitable trades. 
					// If toPrice is smaller than maxIn(for slippage) it will use maxIn.
				According to Uniswap Analysis (see README), AMMs are resistant to large trades, thus the above strategy is flawed. 
				
				Instead this tradesize will ensure that trades are not > reserves, and above, size will be min(maxIn, toPrice)
				
				(Hopefully limiting by target.maxOut is redundant because maxIn works on slippage in the same way, and amountsOut will only calculate a number it will output.)


JETSWAP: Removing Jetswap for now as all trades seem to exit prematurely out of contract without reason.



It would seem like you want to 'buy' the cheaper token, but you actually want to 'sell' the more expensive token.


ex:
A: eth/usd = 1/3000 = on uniswap
B: eth/usd = 1/3100 = on sushiswap
borrow eth on uniswap, sell on sushiswap for 3100 = $100 profit minus fees.




# TODO: Make Univ2 clone contracts, but change name to Jetswap, so I can arb them.



# Ideas:
Price difference between assets could be used as a 'slippage' parameter, to limit trade sizes to available profit, in-line with the 'optimal arbitrage 2' problem. (Though this may already be the effective result of the tradeToPrice function.)


# References:
# In depth study on Uniswap Markets particularly, including 'Optimal Arbitrage' algos:
https://arxiv.org/pdf/1911.03380.pdf
Breakdown of 'Optimal arbitrage in Uniswap':
K = constant product, or x * y = k, where x = reserves of Token0 and y = reserves of Token1
mp = reference/marketPrice (i.e. a price you know you can trade into elsewhere)
α = tokenIn
β = tokenOut
∆α = an amount of tokenIn
∆β = an amount of TokenOut

Rα = reserves from loan pool represented as loanPool.reserves0 * loanpool.reserves1 = loanPool.constantProduct (Kl)
Rβ = reserves from target represented as target.reserves0 * target.reserves1 = target.constantProduct (Kt)

∆β' = loaned amountTokenOut + fee
∆β'- ∆β = profit

Maximize:
mp∆α − ∆β (marketPrice * amountTokenIn - amountTokenOut)

Rα = reserves of tokenIn


if
∆α, ∆β ≥ 0
(Rα − ∆α)(Rβ + γ∆β) = k


# General article on matrix/graph Arbitrage:
https://github.com/ccyanxyz/uniswap-arbitrage-analysis
Note: According to the 'Optimal arbitrage in Uniswap' article, this is completely pointless, as on any robust market like Uniswap, the fees destroy the marginal profits arbitrage is constrained to.




# Working branches:
3ab36d5









###### NOTES FROM UNISWAP DISCORD / CRYPTO RACHEL:

Price Impact Math:

##Based on 10,000 sell token0

orgTotalToken0 = 2000000
orgTotalToken1 = 1000

tokenAmount0selling = 10000

ConstantProduct = orgTotalToken0 * orgTotalToken1

orgPrice = orgTotalToken0/orgTotalToken1

token1change = (orgTotalToken1 - (ConstantProduct / (tokenAmount0selling + orgTotalToken0)))

PricePaidPerToken1 = tokenAmount0selling / token1change

priceDifference = PricePaidPerToken1 - orgPrice

intImpact = priceDifference / orgPrice

PercentImpact = intImpact * 100



# Helfpul stuff:

regex to get rid of script/hardhat bumf:
^(.*Mined empty block range #)(.*)$