import { Contract } from 'ethers'
import {
    algebraFactory,
    algebraQuoter,
    uniswapV3Factory,
    uniswapV2Factory,
    uniswapQuoter,
    uniswapV2Router,
} from '../constants/addresses'
import { abi as IUniswapV2Factory } from '@uniswap/v2-core/build/IUniswapV2Factory.json'
import { abi as IUniswapV3Factory } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import { abi as IAlgebraFactory } from '@cryptoalgebra/core/artifacts/contracts/interfaces/IAlgebraFactory.sol/IAlgebraFactory.json'
import { abi as IAlgebraQuoter } from '@cryptoalgebra/periphery/artifacts/contracts/interfaces/IQuoter.sol/IQuoter.json'
import { abi as IUniswapV3QuoterV2 } from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import { abi as IUniswapV2Router02 } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { signer } from '..//constants/provider'

export function getProtocol(exchange: string): string {
    if (uniswapV2Factory[exchange]) {
        return 'UNIV2'
    }
    if (uniswapV3Factory[exchange]) {
        return 'UNIV3'
    }
    if (algebraFactory[exchange]) {
        return 'ALG'
    } else {
        throw new Error('Exchange not supported')
    }
}

export function getFactory(exchange: string): Contract {
    if (uniswapV2Factory[exchange]) {
        return new Contract(
            uniswapV2Factory[exchange],
            IUniswapV2Factory,
            signer
        )
    }
    if (uniswapV3Factory[exchange]) {
        return new Contract(
            uniswapV3Factory[exchange],
            IUniswapV3Factory,
            signer
        )
    }
    if (algebraFactory[exchange]) {
        return new Contract(algebraFactory[exchange], IAlgebraFactory, signer)
    } else {
        throw new Error('Exchange not supported')
    }
}

export function getQuoterV2(exchange: string): Contract {
    if (uniswapQuoter[exchange]) {
        return new Contract(uniswapQuoter[exchange], IUniswapV3QuoterV2, signer)
    }
    if (algebraQuoter[exchange]) {
        return new Contract(algebraQuoter[exchange], IAlgebraQuoter, signer)
    } else {
        throw new Error('Exchange not supported')
    }
}

export function getRouter(exchange: string): Contract {
    if (uniswapV2Router[exchange]) {
        return new Contract(
            uniswapV2Router[exchange],
            IUniswapV2Router02,
            signer
        )
    } else {
        throw new Error('Exchange not supported')
    }
}
