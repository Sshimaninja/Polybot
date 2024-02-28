import { ethers } from "ethers";
import { provider, signer } from "../constants/provider";
import { abi as IflashMulti } from "../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json";
import { BoolTrade, GAS, GasData } from "../constants/interfaces";
import { logger } from "../constants/logger";

export async function fixEstimateGas(trade: BoolTrade) {
    // logger.info('params: ', p)
    // const flashAddress = await trade.flash.getAddress()
    // logger.info('trade.flash Address: ', flashAddress)
    // logger.info('env.flash   address: ', process.env.FLASH_MULTI)
    // const flashFunction = trade.flash.flashSwap
    // logger.info('flashFunction: ', flashFunction)
    // // console.log('trade.flash:', trade.flash)
    // const swapFunctionSignature = 'swap(uint256,uint256,address,bytes)'
    // const swapFunctionHash = ethers.keccak256(
    //     ethers.toUtf8Bytes(swapFunctionSignature)
    // )
    // const swapFunctionSelector = swapFunctionHash.substring(0, 10)
    // const flashContractInterface = new ethers.Interface(IflashMulti)
    // if (flashContractInterface == undefined) {
    //     console.log('flashContractInterface is undefined')
    // }
    // // Get the FunctionFragment object
    // const flashFragment = flashContractInterface.getFunction('flashSwap')
    // const flashSelector = flashFragment ? flashFragment.selector : undefined
    // // const id = ethers.id(flashSelector)
    // // Get the function selector
    // logger.info('Function fragment: ', flashFragment)
    // logger.info('Function selector: ', flashSelector)
    // const flashSwapFunction = await trade.flash.flashSwap.getFunction()
    // const owner = await trade.flash.checkOwner();
    // const walletAddress = await signer.getAddress;
    // logger.info("Owner: ", owner);
    // logger.info("wallet address: ", walletAddress);
}
