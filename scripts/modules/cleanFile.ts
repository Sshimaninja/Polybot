import fs from 'fs';
import readline from 'readline';

export async function cleanFile(filePath: string, regex: RegExp): Promise<void> {
	const fileStream = fs.createReadStream(filePath);

	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity
	});

	let lines: string[] = [];
	for await (const line of rl) {
		if (!regex.test(line)) {
			lines.push(line);
		}
	}

	fs.writeFileSync(filePath, lines.join('\n'));
}

// Usage:
cleanFile('output.txt', /Mined empty block range #\d+ to #\d+/g);