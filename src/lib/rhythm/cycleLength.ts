import type { PlayablePattern } from './types'
import { getCellValue } from './cells'

export type EvenGrouping = {
  groupLength: number
  groups: number
}

export const COMMON_CYCLE_GROUP_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16] as const

export function getCycleLength(pattern: PlayablePattern): number {
  return pattern.path.reduce((cycleLength, cellId) => cycleLength + (getCellValue(pattern.cells[cellId]) ?? 0), 0)
}

export function getEvenGroupings(
  cycleLength: number,
  groupLengths: readonly number[] = Array.from({ length: 15 }, (_, index) => index + 2),
): EvenGrouping[] {
  if (cycleLength <= 0) {
    return []
  }

  return groupLengths
    .filter((groupLength) => Number.isInteger(groupLength) && groupLength > 0 && cycleLength % groupLength === 0)
    .map((groupLength) => ({
      groupLength,
      groups: cycleLength / groupLength,
    }))
}
