import { config as dotenvConfig } from 'dotenv'
import { ethers } from 'ethers'
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` })

console.log(
    'CURRENT RPC SETTINGS: ',
    'NODE_ENV: ',
    process.env.NODE_ENV,
    'RPC: ',
    process.env.RPC
)
export const provider = new ethers.JsonRpcProvider(process.env.RPC, undefined, {
    staticNetwork: true,
})

export async function checkProvider() {
    const check = await provider.getBlock('latest')
    console.log('CHECK PROVIDER: ', check)
}
checkProvider()
// export const provider = new ethers.AbstractProvider(process.env.RPC)

// export function provider(): Promise<ethers.Provider> {
//     try {
//         const provider = new ethers.AbstractProvider(
//             process.env.RPC,
//             undefined,
//             {
//                 staticNetwork: true,
//             }
//         )
//         return provider
//     } catch (error: any) {
//         console.log('Provider: ', error)
//     }
// }

// provider()
