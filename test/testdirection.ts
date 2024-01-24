import { V2V2SORT } from "../utils/dexdata/v2/comparev2";
import { V2Quote, V2Input } from '../utils/price/uniswap/getPrice';

export async function testDirection() {
	let arrayV2V2 = await V2V2SORT() as any;

	for (let i = 0; i < arrayV2V2.length; i++) {
		let pool = arrayV2V2[i];
		let direction = pool.direction.direction == 'v2a -> v2b' ? 'flashB' : 'flashA';
		let token0address = pool.direction.token0;
		let token1address = pool.direction.token1;
		let loanRouterAddress = pool.direction.loanRouter;
		let recipientRouterAddress = pool.direction.recipientRouter;
		let amountIn = BigInt(1000);
		const route = [token0address, token1address];

		let newDirection = direction;
		while (newDirection === direction) {
			const amountOutA: bigint = await V2Quote(route[0], route[1], amountIn, loanRouterAddress).catch(
				(error: any) => {
					console.log(error);
				}
			);
			const amountOutB: bigint = await V2Quote(route[0], route[1], amountIn, recipientRouterAddress).catch(
				(error: any) => {
					console.log(error);
				}
			);

			const repayAmountInA: bigint = await V2Input(route[0], route[1], amountOutA, loanRouterAddress).catch(
				(error: any) => {
					console.log(error);
				}
			);
			const repayAmountInB: bigint = await V2Input(route[0], route[1], amountOutB, recipientRouterAddress).catch(
				(error: any) => {
					console.log(error);
				}
			);

			if (amountOutB.gt(amountOutA)) {
				newDirection = 'flashB' ? 'flashA' : 'flashB';
			} else {
				newDirection = 'flashA' ? 'flashB' : 'flashA';
			}
		}
	}
}
