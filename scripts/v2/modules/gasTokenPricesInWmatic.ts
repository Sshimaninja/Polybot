import { abi as IPair } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapv2Router02 } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { abi as IUniswapV2Factory } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { abi as IERC20 } from "@uniswap/v2-core/build/IERC20.json";
import { getAmountsOut } from "./getAmountsIOJS";
import { fu, pu } from "../../modules/convertBN";
import { provider } from "../../../constants/provider";
import { ethers } from "ethers";
import {
    gasTokens,
    GasToken,
    uniswapV2Factory,
    uniswapV2Router,
    FactoryMap,
} from "../../../constants/addresses";
import { wmatic, zero } from "../../../constants/environment";
import { string } from "hardhat/internal/core/params/argumentTypes";

// const gasTokenAddresses = gasTokens.map((gt) => gt.address);

export const gasTokenPricesInWmatic = async () => {
    const gasTokenWmaticPools: string[] = [];
    const wmaticID = await wmatic.getAddress();
    let gasWmaticRoute;
    const bigFactory = new ethers.Contract(uniswapV2Factory.QUICK, IUniswapV2Factory, provider);
    for (let tokenID in gasTokens) {
        if (tokenID !== wmaticID) {
            gasWmaticRoute = await bigFactory.getPair(tokenID, wmaticID);
            gasTokenWmaticPools.push(gasWmaticRoute);
        }
    }
    console.log(gasTokenWmaticPools);
};

//     wmaticPrices.push(gasTokens)

//     const gasTokenPrices = await Promise.all(
//         gasTokens.map(async (gt: string) => {
//             const gtContract = new ethers.Contract(
//                 gt,
//                 IERC20,
//                 provider
//             );
//             const gtDecimals = await gtContract.decimals();
//             const gtPrice = await getAmountsOut(
//                 pu(1, gtDecimals),
//                 [uniswapV2Router, uniswapV2Factory],
//                 [gt.address, "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"]
//             );
//             return {
//                 name: gt.name,
//                 address: gt.address,
//                 price: fu(gtPrice, wmaticPrice),
//             };
//         })
//     );

//     return gasTokenPrices;
// };
// ```
