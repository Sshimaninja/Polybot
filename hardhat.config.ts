import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import { config as dotEnvConfig } from 'dotenv'

import '@typechain/hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-verify'

if (process.env.NODE_ENV === 'test') {
    dotEnvConfig({ path: '.env.test' })
} else {
    dotEnvConfig({ path: '.env.live' })
}

module.exports = {
    paths: {
        sources: './contracts/v2',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.19',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.6.9',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.7.5',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },

            // // Override the Uniswap V2 contracts to use Solidity 0.6.9
            // overrides: {
            //   "contracts/v3/*.sol": {
            //     version: "0.8.0",
            //     settings: {
            //       optimizer: {
            //         enabled: true,
            //         runs: 200
            //       },
            //     },
            //   },
            // },
            // },
        ],
    },

    defaultNetwork: 'polygon',
    networks: {
        hardhat: {
            mining: {
                auto: true,
                interval: 2000,
            },
            forking: {
                url: `https://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-`,
                blockNumber: 51500044,
                // blockNumber: 52014583, //using this block because there is a trade on wmatic/collar for troubleshooting
                // blockNumber: 52015625, //WMATIC/PAW trade to troubleshoot.
            },
            accounts: {
                accounts: [process.env.PRIVATE_KEY],
                initialBaseBalance: '1000000000000000000000000000', // 1000000000 ETH in wei
            },
        },
        localhost: {
            url: 'http://127.0.0.1:8545/',
            accounts: 'remote',
        },
        polygon: {
            url: 'https://polygon-mainnet.infura.io/v3/d4003610616e45549765c2945a2f335b',
            // url: `wss://polygon-mainnet.g.alchemy.com/v2/SYBkEnqFyPQHdAZr-TnaUVAmTKfvZZe-`,
            accounts: [process.env.PRIVATE_KEY],
            chainID: 137,
        },
    },
    etherscan: {
        apiKey: {
            polygon: process.env.polygonScanAPI,
            polygonMumbai: process.env.MUMBAISCAN_API_KEY,
        },
    },
}
