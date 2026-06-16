import {
  ALLOWED_STOMP_INTERVALS,
  BPM_MAX,
  BPM_MIN,
  CELL_IDS,
  CELL_VALUE_MAX,
  CELL_VALUE_MIN,
  SOUND_LAYERS,
} from './constants'
import { isValidCellData } from './cells'
import type { CellId, DiamondCells, DiamondPattern, RhythmSettings } from './types'

export function isValidCellId(value: unknown): value is CellId {
  return typeof value === 'string' && CELL_IDS.includes(value as CellId)
}

export function isValidCellValue(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= CELL_VALUE_MIN &&
    value <= CELL_VALUE_MAX
  )
}

export function isValidPath(value: unknown): value is CellId[] {
  return Array.isArray(value) && value.length > 0 && value.every(isValidCellId)
}

export function isValidDiamondCells(value: unknown): value is DiamondCells {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const cells = value as Record<string, unknown>
  return CELL_IDS.every((cellId) => isValidCellData(cells[cellId]))
}

export function isValidPattern(value: unknown): value is DiamondPattern {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const pattern = value as Record<string, unknown>
  return (
    typeof pattern.id === 'string' &&
    pattern.id.trim().length > 0 &&
    typeof pattern.name === 'string' &&
    pattern.name.trim().length > 0 &&
    isValidDiamondCells(pattern.cells) &&
    isValidPath(pattern.path)
  )
}

export function isValidBpm(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= BPM_MIN && value <= BPM_MAX
}

export function isValidStompInterval(
  value: unknown,
): value is (typeof ALLOWED_STOMP_INTERVALS)[number] {
  return (
    typeof value === 'number' &&
    ALLOWED_STOMP_INTERVALS.includes(
      value as (typeof ALLOWED_STOMP_INTERVALS)[number],
    )
  )
}

export function isValidVolume(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

export function isValidSoundToggles(value: unknown): value is RhythmSettings['soundToggles'] {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const toggles = value as Record<string, unknown>
  return SOUND_LAYERS.every((layer) => typeof toggles[layer] === 'boolean')
}

export function isValidSoundVolumes(value: unknown): value is RhythmSettings['soundVolumes'] {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const volumes = value as Record<string, unknown>
  return SOUND_LAYERS.every((layer) => isValidVolume(volumes[layer]))
}

export function isValidRhythmSettings(value: unknown): value is RhythmSettings {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const settings = value as Record<string, unknown>
  return (
    isValidBpm(settings.bpm) &&
    isValidStompInterval(settings.stompInterval) &&
    isValidSoundToggles(settings.soundToggles) &&
    isValidSoundVolumes(settings.soundVolumes)
  )
}

export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) {
    return BPM_MIN
  }

  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value)))
}

export function clampCellValue(value: number): number {
  if (!Number.isFinite(value)) {
    return CELL_VALUE_MIN
  }

  return Math.min(CELL_VALUE_MAX, Math.max(CELL_VALUE_MIN, Math.round(value)))
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(1, Math.max(0, value))
}
