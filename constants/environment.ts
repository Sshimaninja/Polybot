import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { abi as IflashMulti } from "../artifacts/contracts/v2/flashMultiTest.sol/flashMultiTest.json";
import { abi as IflashSingle } from "../artifacts/contracts/v2/flashSingleTest.sol/flashSingleTest.json";
import { provider, wallet, signer } from "./provider";
import { logger } from "./logger";
export const dotenv = dotenvConfig({
    path: `.env.${process.env.NODE_ENV == "test" ? "test" : "live"}`,
});

if (process.env.FLASH_MULTI === undefined || process.env.FLASH_SINGLE === undefined) {
    logger.error("No contract address set in .env file");
    throw new Error("No contract address set in .env file");
}

export const flashMultiID = process.env.FLASH_MULTI;
export const flashSingleID = process.env.FLASH_SINGLE;

export const flashMulti = new ethers.Contract(flashMultiID, IflashMulti, signer);
export const flashSingle = new ethers.Contract(flashSingleID, IflashSingle, signer);
