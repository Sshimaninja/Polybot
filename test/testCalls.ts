// import { ethers } from 'ethers'
// import { abi as IPair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import { abi as Ifactory } from '@uniswap/v2-core/build/IUniswapV2Factory.json'

// import { abi as IUtils } from '../artifacts/contracts/Utils.sol/Utils.json'
// import { uniswapFactory, deployedMap } from '../constants/addresses'
// import { Token } from '@uniswap/sdk-core'
// const addrUtils = deployedMap.UTILS
// import { signer, provider } from '../constants/provider'

// const UTILS = new ethers.Contract(addrUtils, IUtils, signer) //because includes an support math function that its required

// let WETH = new Token(
//     137,
//     '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
//     18,
//     'WETH',
//     'Wrapped Ether'
// )
// let token0dec = 18
// console.log('WETH: ' + WETH.getAddress())
// let USDT = new Token(
//     137,
//     '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
//     6,
//     'USDT',
//     'Tether USD'
// )
// let token1dec = 6
// console.log('USDT: ' + USDT.getAddress())
// let DAI = new Token(
//     137,
//     '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
//     18,
//     'DAI',
//     'Dai Stablecoin'
// )
// let token2dec = 18
// console.log('DAI: ' + DAI.getAddress())

// let token0 = WETH
// let token1 = USDT
// let token2 = DAI

// let sushifactory = new ethers.Contract(uniswapFactory.SUSHI, Ifactory, signer)
// // console.log(sushifactory)
// let quickfactory = new ethers.Contract(uniswapFactory.QUICK, Ifactory, signer)
// // console.log(quickfactory)

// let sushipool = sushifactory.getPair(WETH.getAddress(), USDT.getAddress())
// let quickpool = quickfactory.getPair(WETH.getAddress(), USDT.getAddress())

// let Pair0 = new ethers.Contract(sushipool, IPair, provider)
// if (Pair0 !== undefined) {
//     console.log('Pair0 contract intialized')
// }

// let Pair1 = new ethers.Contract(quickpool, IPair, provider)
// if (Pair1 !== undefined) {
//     console.log('Pair1 contract intialized')
// }

// async function compute() {
//     let aReserves = await Pair0.getReserves()

//     let bReserves = await Pair1.getReserves()

//     let aReserve0 = 1000000
//     let aReserve1 = 4000000
//     let bReserve0 = 1000000
//     let bReserve1 = 6000000
//     let aPrice0 = (aReserve0 / aReserve1).toString()
//     let aPrice1 = (aReserve1 / aReserve0).toString()
//     let bPrice0 = (bReserve0 / bReserve1).toString()
//     let bPrice1 = (bReserve1 / bReserve0).toString()

//     // let aReserve0 = aReserves[0]
//     // let aReserve1 = aReserves[1]
//     // let bReserve0 = bReserves[0]
//     // let bReserve1 = bReserves[1]
//     // let aPrice0 = (aReserves[0] / aReserves[1]).toString()
//     // let aPrice1 = (aReserves[1] / aReserves[0]).toString()
//     // let bPrice0 = (bReserves[0] / bReserves[1]).toString()
//     // let bPrice1 = (bReserves[1] / bReserves[0]).toString()

//     console.log(
//         'WETH/DAI reserves on Sushiswap: \n' + aReserve0 + '/' + aReserve1
//     )
//     console.log('WETH/DAI price on Sushiswap: \n' + aPrice1)
//     console.log(
//         'WETH/DAI reserves on Quickswap: \n' + bReserve0 + '/' + bReserve1
//     )
//     console.log('WETH/DAI price on Quickswap: \n' + bPrice1)

//     // console.log(UTILS)

//     let result = await UTILS.computeProfitMaximizingTrade(
//         ethers.parseEther(aPrice0),
//         ethers.parseEther(bPrice1),
//         aReserve0,
//         bReserve1
//     )
//     //TRUE PRICE IS PRICETOKEN1 ON EXCHANGEB - this is requiring a bit of fiddling
//     let resultFormatted = {
//         direction: result[0],
//         amountIn: fu(result[1], 6),
//     }
//     console.log(resultFormatted)
// }
// compute()

// // async function getReserves(_pairContract: any, _token0: any, _token1: any) {
// //     const reserves = await _pairContract.methods.getReserves().call()
// //     let reservesToken0 = await _pairContract.methods.token0().call()
// //     if (reservesToken0 === _token0.getAddress()) {
// //         return [reserves.reserve0, reserves.reserve1]
// //     } else {
// //         return [reserves.reserve1, reserves.reserve0]
// //     }
// // }
// // getReserves(Pair0, WETH, USDT).then((reserves) => {
// //     console.log(reserves)
// // })

// // getReserves(Pair1, WETH, USDT).then((reserves) => {
// //     console.log(reserves)
// // })
