import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-verify";

dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });
console.log(
    `>>>>>>>>>>>>>>>>>>>>> (hardhat.config.ts) process.env.NODE_ENV: ${process.env.NODE_ENV} `,
);
module.exports = {
    paths: {
        sources: "./contracts/v2",
    },
    solidity: {
        compilers: [
            {
                version: "0.8.19",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.7.5",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },

    defaultNetwork: "polygon",
    networks: {
        hardhat: {
            chainId: 1337,
            mining: {
                auto: true,
                interval: 2000,
            },
            forking: {
                url: `https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-`,
                // blockNumber: 53054772,
                // blockNumber: 51500044, //THIS BLOCK SHOWS 3 PROFITABLE TRADES IN HH.
                // blockNumber: 52014583, //using this block because there is a trade on wmatic/collar for troubleshooting
                // blockNumber: 52015625, //WMATIC/PAW trade to troubleshoot.
                blockNumber: 54852275, // 100% of gas used in this block
            },
            accounts: {
                accounts:
                    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
                initialBaseBalance: "1000000000000000000000000000", // 1000000000 ETH in wei
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            accounts: "remote",
        },
        polygon: {
            url: "http://65.109.125.21:8544",
            // url: `wss://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-`,
            // accounts: [process.env.PRIVATE_KEY],
            chainID: 137,
        },
    },
    etherscan: {
        apiKey: {
            polygon: process.env.polygonScanAPI,
            polygonMumbai: process.env.MUMBAISCAN_API_KEY,
        },
    },
};
