import { getCycleLength } from './cycleLength'
import {
  createPatternFromDiamondPair,
  diamondPairsUpToFifteen,
  type DiamondPair,
} from './diamondLibrary'

export type DiamondSolverValues = {
  beatsPerBar: number | null
  bars: number | null
  targetBeats: number | null
  selectedPair: DiamondPair | null
}

export type DiamondSolverField = {
  value: number | null
  calculated: boolean
}

export type DiamondSolverRecommendation = {
  pair: DiamondPair
  cycleLength: number
  beatDifference: number
}

export type DiamondSolverResult = {
  fields: {
    bars: DiamondSolverField
    targetBeats: DiamondSolverField
  }
  selectedCycleLength: number | null
  selectedBeatDifference: number | null
  selectedBarFit: number | null
  selectedExactBarFit: boolean
  exactRecommendations: DiamondSolverRecommendation[]
  nearestRecommendations: DiamondSolverRecommendation[]
}

const NEAREST_RECOMMENDATION_LIMIT = 3

function isWholeNumber(value: number): boolean {
  return Number.isInteger(value)
}

function getPairCycleLength(pair: DiamondPair): number {
  return getCycleLength(createPatternFromDiamondPair(pair))
}

function getRecommendations(targetBeats: number | null): {
  exact: DiamondSolverRecommendation[]
  nearest: DiamondSolverRecommendation[]
} {
  const allRecommendations = diamondPairsUpToFifteen
    .map((pair) => ({
      pair,
      cycleLength: getPairCycleLength(pair),
      beatDifference: targetBeats === null ? 0 : getPairCycleLength(pair) - targetBeats,
    }))
    .sort((left, right) => left.pair.numerator - right.pair.numerator || left.pair.denominator - right.pair.denominator)

  if (targetBeats === null) {
    return { exact: [], nearest: [] }
  }

  const exact = allRecommendations.filter((recommendation) => recommendation.beatDifference === 0)

  if (exact.length > 0) {
    return { exact, nearest: [] }
  }

  const nearest = allRecommendations
    .sort(
      (left, right) =>
        Math.abs(left.beatDifference) - Math.abs(right.beatDifference) ||
        left.pair.numerator - right.pair.numerator ||
        left.pair.denominator - right.pair.denominator,
    )
    .slice(0, NEAREST_RECOMMENDATION_LIMIT)

  return { exact, nearest }
}

export function solveDiamond(values: DiamondSolverValues): DiamondSolverResult {
  const beatsPerBar = values.beatsPerBar
  const barsFromUser = values.bars
  const selectedCycleLength = values.selectedPair === null ? null : getPairCycleLength(values.selectedPair)
  let targetBeats = values.targetBeats
  let targetBeatsCalculated = false
  let bars = barsFromUser
  let barsCalculated = false

  if (targetBeats === null && beatsPerBar !== null && barsFromUser !== null) {
    targetBeats = beatsPerBar * barsFromUser
    targetBeatsCalculated = true
  }

  if (targetBeats === null && selectedCycleLength !== null) {
    targetBeats = selectedCycleLength
    targetBeatsCalculated = true
  }

  if (bars === null && targetBeats !== null && beatsPerBar !== null) {
    const candidateBars = targetBeats / beatsPerBar

    if (isWholeNumber(candidateBars)) {
      bars = candidateBars
      barsCalculated = true
    }
  }

  const recommendations = getRecommendations(targetBeats)
  const selectedBeatDifference =
    selectedCycleLength !== null && targetBeats !== null ? selectedCycleLength - targetBeats : null
  const selectedBarFit = selectedCycleLength !== null && beatsPerBar !== null ? selectedCycleLength / beatsPerBar : null
  const selectedExactBarFit = selectedBarFit !== null && isWholeNumber(selectedBarFit)

  return {
    fields: {
      bars: { value: bars, calculated: barsCalculated },
      targetBeats: { value: targetBeats, calculated: targetBeatsCalculated },
    },
    selectedCycleLength,
    selectedBeatDifference,
    selectedBarFit,
    selectedExactBarFit,
    exactRecommendations: recommendations.exact,
    nearestRecommendations: recommendations.nearest,
  }
}
