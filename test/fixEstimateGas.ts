import { ethers } from "ethers";
import { provider, signer } from "../constants/provider";
import { abi as IflashMulti } from "../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json";
import { BoolTrade, GAS, GasData } from "../constants/interfaces";
import { logger } from "../constants/logger";

export async function fixEstimateGas(trade: BoolTrade) {
    const params = trade.params;
    for (let p = 0; p < params.length; p++) {
        let pStr = params[p].toString();
        return pStr;
    }
}
