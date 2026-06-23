import type { PlaybackState, PlayablePattern, RhythmSettings, TickEvents } from './types'
import { getCellValue } from './cells'

export function createInitialPlaybackState(pattern: PlayablePattern): PlaybackState {
  const currentPathIndex = pattern.path.findIndex((cellId) => getCellValue(pattern.cells[cellId]) !== null)
  const activeCellId = currentPathIndex >= 0 ? pattern.path[currentPathIndex] ?? null : null

  return {
    isPlaying: false,
    globalTick: 0,
    currentPathIndex: currentPathIndex >= 0 ? currentPathIndex : 0,
    ticksInsideCurrentCell: 0,
    activeCellId,
  }
}

export function getCurrentCellValue(
  pattern: PlayablePattern,
  state: PlaybackState,
): number | null {
  if (state.activeCellId === null) {
    return null
  }

  return getCellValue(pattern.cells[state.activeCellId])
}

export function getTickEvents(
  pattern: PlayablePattern,
  settings: RhythmSettings,
  state: PlaybackState,
): TickEvents {
  const hasActivePath = pattern.path.length > 0 && state.activeCellId !== null
  const accent = hasActivePath && state.ticksInsideCurrentCell === 0
  const cycleAccent = accent && state.currentPathIndex === 0

  return {
    globalTick: state.globalTick,
    stomp: state.globalTick % settings.stompInterval === 0,
    subdivision: !accent && !cycleAccent,
    accent,
    cycleAccent,
    activeCellId: hasActivePath ? state.activeCellId : null,
    currentPathIndex: hasActivePath ? state.currentPathIndex : 0,
    ticksInsideCurrentCell: hasActivePath ? state.ticksInsideCurrentCell : 0,
  }
}

export function normalizePlaybackStateForPattern(
  pattern: PlayablePattern,
  state: PlaybackState,
): PlaybackState {
  if (pattern.path.length === 0) {
    return {
      ...state,
      currentPathIndex: 0,
      ticksInsideCurrentCell: 0,
      activeCellId: null,
    }
  }

  const clampedPathIndex = Math.min(
    Math.max(0, state.currentPathIndex),
    pattern.path.length - 1,
  )
  const clampedActiveCellId = pattern.path[clampedPathIndex] ?? null
  const currentPathIndex =
    clampedActiveCellId !== null && getCellValue(pattern.cells[clampedActiveCellId]) !== null
      ? clampedPathIndex
      : pattern.path.findIndex((cellId) => getCellValue(pattern.cells[cellId]) !== null)
  const activeCellId = currentPathIndex >= 0 ? pattern.path[currentPathIndex] ?? null : null
  const activeCellValue = activeCellId === null ? null : getCellValue(pattern.cells[activeCellId])
  const ticksInsideCurrentCell =
    activeCellValue === null || activeCellValue <= 0
      ? 0
      : Math.min(Math.max(0, state.ticksInsideCurrentCell), activeCellValue - 1)

  return {
    ...state,
    currentPathIndex: currentPathIndex >= 0 ? currentPathIndex : 0,
    ticksInsideCurrentCell,
    activeCellId,
  }
}

export function advancePlaybackState(
  pattern: PlayablePattern,
  state: PlaybackState,
): PlaybackState {
  if (pattern.path.length === 0 || state.activeCellId === null) {
    return {
      ...state,
      globalTick: state.globalTick + 1,
      activeCellId: null,
      currentPathIndex: 0,
      ticksInsideCurrentCell: 0,
    }
  }

  const currentCellValue = getCurrentCellValue(pattern, state)

  if (currentCellValue === null || currentCellValue <= 0) {
    return {
      ...state,
      globalTick: state.globalTick + 1,
      activeCellId: null,
      currentPathIndex: 0,
      ticksInsideCurrentCell: 0,
    }
  }

  const nextGlobalTick = state.globalTick + 1
  const nextTicksInsideCurrentCell = state.ticksInsideCurrentCell + 1

  if (nextTicksInsideCurrentCell >= currentCellValue) {
    const nextPathIndex = (state.currentPathIndex + 1) % pattern.path.length

    return {
      ...state,
      globalTick: nextGlobalTick,
      currentPathIndex: nextPathIndex,
      ticksInsideCurrentCell: 0,
      activeCellId: pattern.path[nextPathIndex] ?? null,
    }
  }

  return {
    ...state,
    globalTick: nextGlobalTick,
    ticksInsideCurrentCell: nextTicksInsideCurrentCell,
  }
}
