import { BigNumber as BN } from 'bignumber.js'

export async function getHiLo(a1: BN, b1: BN) {
    let higher = BN.max((a1), (b1))
    let lower = BN.min((a1), (b1))
    return { higher, lower }

}

export async function getGreaterLesser(a0: BN, b0: BN) {
    let greater = BN.max((a0), (b0))
    let lesser = BN.min((a0), (b0))
    return { greater, lesser }
}

export async function getDifference(higher: BN, lower: BN) {
    let difference = higher.minus(lower)
    let differencePercent = (difference.div(higher)).multipliedBy(100)
    return { difference, differencePercent }
}