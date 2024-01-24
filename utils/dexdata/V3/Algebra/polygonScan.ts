import axios from "axios";

const apiKey = "YOUR_API_KEY"; // replace with your PolygonScan API key
const contractAddress = "0x1234567890123456789012345678901234567890"; // replace with the address of the AlgebraFactory contract
const apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;

async function getDeployedPools() {
	try {
		const response = await axios.get(apiUrl);
		const transactions = response.data.result;
		const poolAddresses = transactions
			.filter((tx: { to: string; input: string; }) => tx.to === contractAddress && tx.input.startsWith("0x60fe47b1"))
			.map((tx: { contractAddress: any; }) => tx.contractAddress);
		console.log(poolAddresses);
	} catch (error) {
		console.error(error);
	}
}

getDeployedPools();