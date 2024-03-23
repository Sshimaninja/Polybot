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
// export var gasMult = 9n * 10n ** 9n;

export async function getGasData(): Promise<GasData> {
    let gasData: GasData = {
        tested: false,
        gasEstimate: 400000n,
        gasPrice: 0n,
        maxFee: 0n,
        maxPriorityFee: 0n,
    };
    const ethersGas = await provider.getFeeData();
    if (!ethersGas || ethersGas.maxPriorityFeePerGas == null) {
        console.log("Error in Polygon getGasData: Using default gasData");
        return gasData;
    }
    const block = await provider.getBlock("latest");
    if (!block) {
        console.log("Error in Polygon getGasData: Using default gasData");
        return gasData;
    }
    const gasLimit = block.gasLimit;

    let gasEstimate = gasLimit;

    gasData = {
        tested: false,
        gasEstimate: gasEstimate,
        gasPrice: 0n,
        maxFee: ethersGas.maxPriorityFeePerGas,
        maxPriorityFee: ethersGas.maxPriorityFeePerGas,
    };
    gasData.gasPrice = gasData.maxFee * gasData.gasEstimate; // * baseFee!;
    gasData.gasPrice; //+= gasMult;
    gasData.maxFee; //+= gasMult;
    gasData.maxPriorityFee; //+= gasMult;
    console.log("EthersGas: ", gasData);
    // No good for testing becasue it pulls from live data not the block on hardhat local fork.
    // const polygonGasData: PolygonGasData = (
    //     await axios.get("https://gasstation.polygon.technology/v2")
    // ).data;
    // if (polygonGasData) {
    //     gasData = {
    //         gasEstimate: gasEstimate,
    //         gasPrice:
    //             pu(
    //                 Math.round(polygonGasData.fast.maxPriorityFee).toString(),
    //                 "gwei",
    //             ) * gasData.gasEstimate, //ethersGasData.gasPrice,
    //         maxFee: pu(
    //             Math.round(polygonGasData.fast.maxFee).toString(),
    //             "gwei",
    //         ),
    //         maxPriorityFee: pu(
    //             Math.round(polygonGasData.fast.maxPriorityFee).toString(),
    //             "gwei",
    //         ),
    //     };
    //     console.log("PolyGas: ", gasData);
    //     return gasData;
    // } else if (ethersGasData) {
    //     return gasData;
    // }
    // console.log("Error in Polygon getGasData: Using default gasData");
    return gasData;
}
