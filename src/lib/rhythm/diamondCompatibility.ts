import { getCycleLength } from './cycleLength'
import { createPatternFromDiamondPair, diamondPairsUpToFifteen, type DiamondPair } from './diamondLibrary'

export const SUPPORTED_DIVISIBILITY_DIVISORS = [3, 4, 5, 7] as const

export type SupportedDivisibilityDivisor = (typeof SUPPORTED_DIVISIBILITY_DIVISORS)[number]

export type DiamondDivisibility = {
  pairId: string
  cycleLength: number
  divisors: SupportedDivisibilityDivisor[]
}

export function getSupportedDivisorsForCycle(cycleLength: number): SupportedDivisibilityDivisor[] {
  return SUPPORTED_DIVISIBILITY_DIVISORS.filter((divisor) => cycleLength % divisor === 0)
}

function getDiamondDivisibility(pair: DiamondPair): DiamondDivisibility {
  const cycleLength = getCycleLength(createPatternFromDiamondPair(pair))

  return {
    pairId: pair.id,
    cycleLength,
    divisors: getSupportedDivisorsForCycle(cycleLength),
  }
}

export const diamondDivisibilityByPairId = new Map<string, DiamondDivisibility>(
  diamondPairsUpToFifteen.map((pair) => [pair.id, getDiamondDivisibility(pair)]),
)
