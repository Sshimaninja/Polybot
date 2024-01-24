import fs from 'fs';
import util from 'util';

let logFile = fs.createWriteStream('consolelog.txt', { flags: 'a' });

export function hardhatLogToFile() {
	let output = util.format(...arguments);
	let regex = /eth_call\s+Contract call:\s+<UnrecognizedContract>\s+From:\s+0x[a-fA-F0-9]{40}\s+To:\s+0x[a-fA-F0-9]{40}/g;
	if (!regex.test(output)) {
		logFile.write(output + '\n');
	}
}


