import { control } from './scripts/v3/control'
import { Environment } from './constants/environment'
import { getGasData } from './scripts/v2/modules/getPolygonGasPrices'
import fs from 'fs'
import path from 'path'
import { V3Matches } from './constants/interfaces'
import { telegramInfo } from './scripts/v2/modules/notify'
const env = new Environment()
async function main() {
    const message = `Polybot V3 Started: ${Date.now()}`
    console.log(message)
    await telegramInfo(message)

    let matchDir =
        '/mnt/d/code/arbitrage/polybot-live/polybotv3/data/matches/v3/'

    const files = await fs.promises.readdir(matchDir)
    const pairList: V3Matches[] = await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(matchDir, file)
            const data = await fs.promises.readFile(filePath, 'utf8')
            return JSON.parse(data)
        })
    )

    env.provider.on('block', async (blockNumber: any) => {
        console.log('New block received: Block # ' + blockNumber)
        const gasData = await getGasData()
        await Promise.all(pairList.map((pair) => control(pair, gasData)))
    })
}

main().catch((error) => {
    console.error(`MAIN ERROR:  ${error.stack}`)
})
