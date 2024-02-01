import { control } from './scripts/v2/control'
import { provider } from './constants/environment'
import { getGasData } from './scripts/v2/modules/getPolygonGasPrices'
import fs from 'fs'
import path from 'path'
import { FactoryPair } from './constants/interfaces'
import { logger } from './constants/logger'
import { telegramInfo } from './scripts//v2/modules/notify'

async function main() {
    // // Set up Telegram message
    const message = `Polybot V2 Started: ${Date.now()}`
    await telegramInfo(message)
    // full path to matches dataDir : '/mnt/d/code/arbitrage/polybot-live/polybotv3/data/matches/v2/'
    let matchDir = path.join(__dirname, './data/matches/v2/') // path.join(__dirname, '/data/matches/v2/');
    async function dataFeed() {
        const pairList: FactoryPair[] = []
        const files = await fs.promises.readdir(matchDir)
        // for (const file of files) {
        files.forEach(async (file) => {
            const filePath = path.join(matchDir, file)
            const stats = await fs.promises.stat(filePath)
            if (stats.isFile()) {
                const data = await fs.promises.readFile(filePath, 'utf8')
                try {
                    const pairs = JSON.parse(data)
                    pairList.push(pairs)
                } catch (error) {
                    console.error(`Error parsing file ${filePath}:`, error)
                    console.error('Data:', data)
                }
            }
        })
        console.log(pairList)
        return pairList
    }

    let pairList: FactoryPair[] = await dataFeed()

    provider.on('block', async (blockNumber: any) => {
        if (blockNumber === null || undefined) return
        logger.info('New block received: Block # ' + blockNumber)
        try {
            const gasData = await getGasData()
            await Promise.all(
                pairList.map(async (pairList: any) => {
                    await control(pairList, gasData)
                })
            )
        } catch (error: any) {
            //Verbose:
            logger.error(`PROVIDER ERROR: ${error.stack}`)
            //Concise:
            // logger.error("PROVIDER ERROR: " + error.message);
            return
        }
    })
}

main().catch((error) => {
    logger.error(`MAIN ERROR:  ${error.stack}`)
    return
})

// pairList = [
//     //TESTING
//     {
//         exchangeA: 'APE',
//         factoryA_id: '0xCf083Be4164828f00cAE704EC15a36D711491284',
//         routerA_id: '0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607',
//         exchangeB: 'SUSHI',
//         factoryB_id: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
//         routerB_id: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
//         matches: [
//             {
//                 ticker: 'WMATIC/LINK',
//                 poolAID: '0xa8EcA6Cc6Fb9F8Cfa9D3B17D4997ccE79E5110cf',
//                 poolBID: '0x68ccE7049013ca8df91CD512ceFEe8FC0bb8d926',
//                 token0: {
//                     symbol: 'WMATIC',
//                     id: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
//                     decimals: 18,
//                 },
//                 token1: {
//                     symbol: 'LINK',
//                     id: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
//                     decimals: 18,
//                 },
//             },
//         ],
//     },
// ] //TESTING
