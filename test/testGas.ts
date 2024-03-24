import { control } from "../scripts/v2/control";
import { provider } from "../constants/provider";
import { getGasData } from "../scripts/v2/modules/getPolygonGasPrices";
import fs from "fs";
import path from "path";
import { FactoryPair } from "../constants/interfaces";
import { logger } from "../constants/logger";
import { telegramInfo } from "../scripts/v2/modules/transaction/notify";
import { fetchGasPriceOnce } from "../scripts/v2/modules/transaction/fetchGasPriceOnce";
import { fu } from "../scripts/modules/convertBN";
// import { fetchGasPriceOnce } from "./scripts/v2/modules/transaction/fetchGasPriceOnce";

async function testGas() {
    try {
        let gasData = await getGasData();
        gasData = await fetchGasPriceOnce(gasData);
        console.log(gasData);
        const gasPrice = fu(gasData.gasEstimate * gasData.maxFee, 18);
        console.log("Gas Price: ", gasPrice);
    } catch (error: any) {
        console.log(error);
    }
}
testGas();
