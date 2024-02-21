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
        gasEstimate: 51193294404n,
        gasPrice: 0n,
        maxFee: 0n,
        maxPriorityFee: 0n,
    };

    const ethersGas = await provider.getFeeData();
    const block = await provider.getBlock("latest");
    let baseFee = block?.baseFeePerGas;

    let ethersGasData: GasData = {
        gasEstimate: baseFee ?? 30000000n,
        gasPrice: ethersGas.gasPrice != null ? ethersGas.gasPrice : gasData.gasPrice,
        maxFee: ethersGas.maxFeePerGas != null ? ethersGas.maxFeePerGas : gasData.maxFee,
        maxPriorityFee:
            ethersGas.maxPriorityFeePerGas != null
                ? ethersGas.maxPriorityFeePerGas
                : gasData.maxPriorityFee,
    };
    ethersGasData.gasPrice += gasMult;
    ethersGasData.maxFee += gasMult;
    ethersGasData.maxPriorityFee += gasMult;

    // console.log("Ethers Gas Data: ", ethersGasData);

    const polygonGasData: PolygonGasData = (
        await axios.get("https://gasstation.polygon.technology/v2")
    ).data;
    if (polygonGasData) {
        let polyGas: GasData = {
            gasEstimate: pu(polygonGasData.estimatedBaseFee.toString(), "gwei"),
            gasPrice: pu(
                Math.round(polygonGasData.fast.maxFee * polygonGasData.estimatedBaseFee).toString(),
                "gwei",
            ), //ethersGasData.gasPrice,
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
