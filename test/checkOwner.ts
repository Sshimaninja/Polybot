import { signer, wallet } from '../constants/provider'
import { abi as IcheckOwner } from '../artifacts/contracts/v2/checkOwner.sol/isItMine.json'
import { provider } from '../constants/provider'
import { ethers } from 'ethers'

const checkOwnerContract = new ethers.Contract(
    '0x8DcE8FB00f04A7EE9fEB498cEf86f410de83CA89',
    IcheckOwner,
    provider
)

export async function checkOwner() {
    const owner = await checkOwnerContract.checkOwner()
    console.log(owner)
}
checkOwner()
