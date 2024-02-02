// import { ethers } from 'hardhat'
// import { provider } from '../constants/provider'

// async function main() {
//     // const [deployer] = await ethers.getSigners();

//     // const walletAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
//     const privateKey =
//         '0xYOURKEYHERE'
//     const wallet = new ethers.Wallet(privateKey, provider)
//     const deployer = wallet.connect(provider)

//     console.log('Deploying contracts with the account:', deployer.getAddress())

//     console.log('Account balance:', (await deployer.getBalance()).toString())

//     console.log('fetching MockWMATIC...')
//     const Token = await ethers.getContractFactory('MockWMATIC')
//     console.log('Deploying WMATIC...')
//     const wmatic = await Token.deploy('Wrapped Matic', 'WMATIC', {
//         gasLimit: 5000000,
//     })
//     console.log('WMATIC address:', wmatic.getAddress())

//     // Mint some tokens
//     await wmatic.mint(
//         '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
//         ethers.parseEther('100000')
//     )
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error)
//         process.exit(1)
//     })
