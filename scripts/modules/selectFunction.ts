// import { provider } from '../../constants/contract'
import { abi as IUniswapPairV2 } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { ethers } from 'ethers'
const provider = new ethers.JsonRpcProvider(process.env.RPC)
async function selectSwap() {
    const pools: any = {
        sushiPool: '0x68ccE7049013ca8df91CD512ceFEe8FC0bb8d926',
        apePool: '0xa8EcA6Cc6Fb9F8Cfa9D3B17D4997ccE79E5110cf',
    }

    for (const pool in pools) {
        console.log(pools[pool])
        const contract = new ethers.Contract(
            pools[pool],
            IUniswapPairV2,
            provider
        )
        // const r = await contract.getReserves()
        // console.log(r)
        console.log(contract.interface)
        const getSwap = contract.swap()
        console.log(getSwap)
    }
}
selectSwap()
