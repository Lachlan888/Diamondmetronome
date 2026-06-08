import type { DiamondPattern } from '../rhythm/types'
import { isValidPattern } from '../rhythm/validation'

export const SAVED_PATTERN_STORAGE_KEY = 'diamond-metronome:saved-pattern'

export type SavedPatternData = {
  version: 1
  pattern: DiamondPattern
  savedAt: string
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

function isSavedPatternData(value: unknown): value is SavedPatternData {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const data = value as Record<string, unknown>

  return data.version === 1 && typeof data.savedAt === 'string' && isValidPattern(data.pattern)
}

export function savePattern(pattern: DiamondPattern): void {
  if (!canUseLocalStorage() || !isValidPattern(pattern)) {
    return
  }

  const data: SavedPatternData = {
    version: 1,
    pattern,
    savedAt: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(SAVED_PATTERN_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage can fail in private or restricted browser contexts.
  }
}

export function loadSavedPatternData(): SavedPatternData | null {
  if (!canUseLocalStorage()) {
    return null
  }

  let rawValue: string | null

  try {
    rawValue = window.localStorage.getItem(SAVED_PATTERN_STORAGE_KEY)
  } catch {
    return null
  }

  if (rawValue === null) {
    return null
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    return isSavedPatternData(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

export function loadSavedPattern(): DiamondPattern | null {
  return loadSavedPatternData()?.pattern ?? null
}

export function clearSavedPattern(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(SAVED_PATTERN_STORAGE_KEY)
  } catch {
    // Ignore restricted storage contexts.
  }
}

export function hasSavedPattern(): boolean {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    return window.localStorage.getItem(SAVED_PATTERN_STORAGE_KEY) !== null
  } catch {
    return false
  }
}
