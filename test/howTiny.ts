import { abi as ITiny } from '../artifacts/contracts/v2/tiny.sol/Tiny.json'
import { provider } from '../constants/provider'
import { ethers } from 'ethers'
export async function howTiny() {
    const tiny = new ethers.Contract(
        '0x5Bb7c369b66657F0326E29A6eb1Cd538B5c8f9DF',
        ITiny,
        provider
    )
    const thisTiny = await tiny.howTiny()
    console.log(thisTiny.toString())
}
howTiny()
