import { CELL_IDS } from './constants'
import type { CellId, DiamondPattern } from './types'

export type RandomDiamondOptions = {
  minValue: number
  maxValue: number
  includeOne: boolean
  allowReduciblePairs: boolean
}

export const defaultRandomDiamondOptions: RandomDiamondOptions = {
  minValue: 1,
  maxValue: 15,
  includeOne: true,
  allowReduciblePairs: true,
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b !== 0) {
    const nextB = a % b
    a = b
    b = nextB
  }

  return a
}

function randomInteger(minValue: number, maxValue: number): number {
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
}

function shuffleCells(cells: CellId[]): CellId[] {
  const shuffledCells = [...cells]

  for (let index = shuffledCells.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index)
    const previousValue = shuffledCells[index]
    shuffledCells[index] = shuffledCells[swapIndex]
    shuffledCells[swapIndex] = previousValue
  }

  return shuffledCells
}

function getCandidateValues(options: RandomDiamondOptions): number[] {
  const minValue = Math.max(1, Math.floor(options.minValue))
  const maxValue = Math.max(minValue, Math.floor(options.maxValue))
  const values = Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index)

  return options.includeOne ? values : values.filter((value) => value !== 1)
}

function chooseNumberPair(options: RandomDiamondOptions): [number, number] {
  const candidateValues = getCandidateValues(options)
  const candidatePairs = candidateValues.flatMap((numberA) =>
    candidateValues
      .filter((numberB) => {
        if (numberA === numberB) {
          return false
        }

        return options.allowReduciblePairs || greatestCommonDivisor(numberA, numberB) === 1
      })
      .map((numberB): [number, number] => [numberA, numberB]),
  )

  if (candidatePairs.length === 0) {
    return [2, 3]
  }

  return candidatePairs[randomInteger(0, candidatePairs.length - 1)]
}

function choosePath(): CellId[] {
  return shuffleCells(CELL_IDS)
}

export function generateRandomDiamond(options: RandomDiamondOptions): DiamondPattern {
  const [numberA, numberB] = chooseNumberPair(options)
  const path = choosePath()

  return {
    id: `random-diamond-${numberA}-${numberB}-${Date.now().toString(36)}-${randomInteger(1000, 9999)}`,
    name: `Random Diamond: ${numberA}/${numberB}, full path`,
    cells: {
      top: numberA,
      upperLeft: numberB,
      upperRight: numberB,
      middleLeft: numberB,
      centre: numberA,
      middleRight: numberB,
      lowerLeft: numberB,
      lowerRight: numberB,
      bottom: numberA,
    },
    path,
  }
}
