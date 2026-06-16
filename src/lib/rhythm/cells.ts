import { CELL_VALUE_MAX, CELL_VALUE_MIN } from './constants'
import type { CellCutSettings, CellData, CellSettings } from './types'

export const CUT_PHRASE_UNIT_MAX = 15

function clampCellValueForSettings(value: number): number {
  if (!Number.isFinite(value)) {
    return CELL_VALUE_MIN
  }

  return Math.min(CELL_VALUE_MAX, Math.max(CELL_VALUE_MIN, Math.round(value)))
}

export function getCellValue(cell: CellData | undefined): number | null {
  if (typeof cell === 'number') {
    return clampCellValueForSettings(cell)
  }

  if (cell && typeof cell.value === 'number') {
    return clampCellValueForSettings(cell.value)
  }

  return null
}

export function normalizeCellSettings(cell: CellData): CellSettings {
  if (typeof cell === 'number') {
    return {
      value: clampCellValueForSettings(cell),
    }
  }

  return {
    value: clampCellValueForSettings(cell.value),
    ...(isValidCellCut(cell.cut, clampCellValueForSettings(cell.value)) ? { cut: cell.cut } : {}),
  }
}

export function getCellCut(cell: CellData | undefined): CellCutSettings | null {
  if (typeof cell !== 'object' || cell === null) {
    return null
  }

  const value = getCellValue(cell)

  if (value === null || !isValidCellCut(cell.cut, value) || !cell.cut.enabled) {
    return null
  }

  return cell.cut
}

export function getDefaultCutPhrase(value: number): number[] {
  const cellValue = clampCellValueForSettings(value)

  return [cellValue, cellValue]
}

export function parseCutPhrase(value: string): number[] | null {
  const phrase = value
    .split(/[,+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)

  if (
    phrase.length === 0 ||
    phrase.some((part) => !Number.isInteger(part) || part <= 0 || part > CUT_PHRASE_UNIT_MAX)
  ) {
    return null
  }

  return phrase
}

export function getCutPhraseTotal(phrase: number[]): number {
  return phrase.reduce((total, part) => total + part, 0)
}

export function isValidCellCut(value: unknown, cellValue: number): value is CellCutSettings {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const cut = value as Record<string, unknown>

  return (
    cut.enabled === true &&
    cut.multiplier === 2 &&
    Array.isArray(cut.phrase) &&
    cut.phrase.length > 0 &&
    cut.phrase.every((part) => Number.isInteger(part) && part > 0 && part <= CUT_PHRASE_UNIT_MAX) &&
    getCutPhraseTotal(cut.phrase) === clampCellValueForSettings(cellValue) * 2
  )
}

export function isValidCellData(value: unknown): value is CellData {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= CELL_VALUE_MIN && value <= CELL_VALUE_MAX
  }

  if (typeof value !== 'object' || value === null) {
    return false
  }

  const cell = value as Record<string, unknown>

  if (typeof cell.value !== 'number' || !Number.isInteger(cell.value)) {
    return false
  }

  if (cell.value < CELL_VALUE_MIN || cell.value > CELL_VALUE_MAX) {
    return false
  }

  return cell.cut === undefined || isValidCellCut(cell.cut, cell.value)
}
