import { PoolMatcher } from './matchPairs';
import path from 'path';

export async function makePairModule() {
	const dataDir = path.join(__dirname, '../../../data/validPairs/v2/');
	const matchesDir = path.join(__dirname, '../../../data/matches/v2/');
	const allMatches = new PoolMatcher(dataDir, matchesDir);
	const matches = await allMatches.matchPairs();
	// console.log(matches)
}
makePairModule();