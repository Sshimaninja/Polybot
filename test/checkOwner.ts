import { provider, signer, wallet } from '../constants/environment'
import { abi as IFlash } from '../artifacts/contracts/flashOne.sol/flashOne.json'
import { deployedMap } from '../constants/addresses'
import { Contract } from '@ethersproject/contracts'

async function checkOwner() {
    const flash = new Contract(deployedMap.flashTest, IFlash, provider)
    const owner = await flash.checkOwner()
    console.log(owner)
}
checkOwner()
