import { defaultPattern } from './patterns'
import type { DiamondPattern } from './types'

export type DiamondPair = {
  id: string
  numerator: number
  denominator: number
  name: string
  inverseId: string
}

function createPair(numerator: number, denominator: number): DiamondPair {
  return {
    id: `pair-${numerator}-${denominator}`,
    numerator,
    denominator,
    name: `${numerator}/${denominator} Diamond`,
    inverseId: `pair-${denominator}-${numerator}`,
  }
}

export const DIAMOND_PAIR_MAX = 15

export const diamondPairsUpToFifteen: DiamondPair[] = Array.from({ length: DIAMOND_PAIR_MAX }, (_, numeratorIndex) =>
  Array.from({ length: DIAMOND_PAIR_MAX }, (_, denominatorIndex) => {
    const numerator = numeratorIndex + 1
    const denominator = denominatorIndex + 1

    return numerator === denominator ? null : createPair(numerator, denominator)
  }),
).flatMap((pairs) => pairs.filter((pair): pair is DiamondPair => pair !== null))

export function getDiamondPairById(id: string): DiamondPair | null {
  return diamondPairsUpToFifteen.find((pair) => pair.id === id) ?? null
}

export function getInverseDiamondPair(id: string): DiamondPair | null {
  const pair = getDiamondPairById(id)

  if (pair === null) {
    return null
  }

  return getDiamondPairById(pair.inverseId)
}

export function createPatternFromDiamondPair(pair: DiamondPair): DiamondPattern {
  return {
    id: `diamond-${pair.numerator}-${pair.denominator}`,
    name: pair.name,
    cells: {
      top: pair.numerator,
      upperLeft: pair.denominator,
      upperRight: pair.denominator,
      middleLeft: pair.denominator,
      centre: pair.numerator,
      middleRight: pair.denominator,
      lowerLeft: pair.denominator,
      lowerRight: pair.denominator,
      bottom: pair.numerator,
    },
    path: [...defaultPattern.path],
  }
}
