import { signer, wallet, flashMulti } from '../constants/environment'
import { abi as IFlash } from '../artifacts/contracts/v2/flashMulti.sol/flashMulti.json'
import { deployedMap } from '../constants/addresses'
import { provider } from '../constants/provider'
import { ethers } from 'ethers'
async function checkOwner() {
    const owner = await flashMulti.checkOwner()
    console.log(owner)
}
checkOwner()
