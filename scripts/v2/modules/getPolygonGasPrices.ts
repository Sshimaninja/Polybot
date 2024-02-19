import axios from "axios";
import { provider } from "../../../constants/provider";
import { GasData, PolygonGasData } from "../../../constants/interfaces";
import { pu } from "../../modules/convertBN";
/**
 *
 * @returns suggested gasData from polygon gas station, ballback to ethers.js gasData, fallback to default gasData
 *
 *
 */
export var gasMult = 9n * 10n ** 9n;

export async function getGasData(): Promise<GasData> {
    var gasData: GasData = {
        gasPrice: 50000000001n,
        gasEstimate: 50000000001n,
        maxFee: 51193294404n,
        maxPriorityFee: 34200000000n,
    };

    const ethersGas = await provider.getFeeData();

    let ethersGasData = {
        gasPrice: ethersGas.gasPrice != null ? ethersGas.gasPrice : gasData.gasPrice,
        gasEstimate: ethersGas.gasPrice != null ? ethersGas.gasPrice : gasData.gasEstimate,
        maxFee: ethersGas.maxFeePerGas != null ? ethersGas.maxFeePerGas : gasData.maxFee,
        maxPriorityFee:
            ethersGas.maxPriorityFeePerGas != null
                ? ethersGas.maxPriorityFeePerGas
                : gasData.maxPriorityFee,
    };
    ethersGasData.maxFee += gasMult;
    ethersGasData.maxPriorityFee += gasMult;

    // console.log("Ethers Gas Data: ", ethersGasData);

    const polygonGasData: PolygonGasData = (
        await axios.get("https://gasstation.polygon.technology/v2")
    ).data;
    if (polygonGasData) {
        const polyGas = {
            gasPrice: pu(
                Math.round(polygonGasData.fast.maxFee * polygonGasData.estimatedBaseFee).toString(),
                "gwei",
            ), //ethersGasData.gasPrice,
            gasEstimate: pu(Math.round(polygonGasData.estimatedBaseFee).toString(), "gwei"), //ethersGasData.gasPrice,
            maxFee: pu(Math.round(polygonGasData.fast.maxFee).toString(), "gwei"),
            maxPriorityFee: pu(Math.round(polygonGasData.fast.maxPriorityFee).toString(), "gwei"),
        };
        // console.log("Polygon Gas Data: ", polygonGasData);
        // console.log("PolyGas: ", polyGas);
        return polyGas;
    }
    if (ethersGasData) {
        return ethersGasData;
    }
    console.log("Error in getGasData: Using default gasData");
    return gasData;
}
getGasData();
