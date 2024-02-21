import axios from "axios";
import { provider } from "../../../constants/provider";
import { GasData, PolygonGasData } from "../../../constants/interfaces";
import { fu, pu } from "../../modules/convertBN";
/**
 *
 * @returns suggested gasData from polygon gas station, ballback to ethers.js gasData, fallback to default gasData
 *
 *
 */
export var gasMult = 9n * 10n ** 9n;

export async function getGasData(): Promise<GasData> {
    let gasData: GasData = {
        gasEstimate: 400000n,
        gasPrice: 0n,
        maxFee: 0n,
        maxPriorityFee: 0n,
    };

    const ethersGas = await provider.getFeeData();
    const block = await provider.getBlock("latest");
    let baseFee = block?.baseFeePerGas;

    let ethersGasData: GasData = {
        gasPrice: 0n,
        gasEstimate: 400000n,
        maxFee: ethersGas.maxFeePerGas != null ? ethersGas.maxFeePerGas : gasData.maxFee,
        maxPriorityFee:
            ethersGas.maxPriorityFeePerGas != null
                ? ethersGas.maxPriorityFeePerGas
                : gasData.maxPriorityFee,
    };
    ethersGasData.gasPrice = ethersGasData.maxFee + ethersGasData.gasEstimate * baseFee!;
    ethersGasData.gasPrice += gasMult;
    ethersGasData.maxFee += gasMult;
    ethersGasData.maxPriorityFee += gasMult;

    const polygonGasData: PolygonGasData = (
        await axios.get("https://gasstation.polygon.technology/v2")
    ).data;
    if (polygonGasData) {
        gasData = {
            gasEstimate: 400000n,
            gasPrice:
                pu(Math.round(polygonGasData.fast.maxFee).toString(), "gwei") * gasData.gasEstimate, //ethersGasData.gasPrice,
            maxFee: pu(Math.round(polygonGasData.fast.maxFee).toString(), "gwei"),
            maxPriorityFee: pu(Math.round(polygonGasData.fast.maxPriorityFee).toString(), "gwei"),
        };
        console.log("PolyGas: ", gasData);
        return gasData;
    }
    if (ethersGasData) {
        return gasData;
    }
    console.log("Error in getGasData: Using default gasData");
    return gasData;
}
