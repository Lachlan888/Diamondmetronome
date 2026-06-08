import type { DiamondPattern, PlaybackState, RhythmSettings, TickEvents } from './types'

export function createInitialPlaybackState(pattern: DiamondPattern): PlaybackState {
  const activeCellId = pattern.path[0] ?? null

  return {
    isPlaying: false,
    globalTick: 0,
    currentPathIndex: 0,
    ticksInsideCurrentCell: 0,
    activeCellId,
  }
}

export function getCurrentCellValue(
  pattern: DiamondPattern,
  state: PlaybackState,
): number | null {
  if (state.activeCellId === null) {
    return null
  }

  return pattern.cells[state.activeCellId] ?? null
}

export function getTickEvents(
  pattern: DiamondPattern,
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
  pattern: DiamondPattern,
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

  const currentPathIndex = Math.min(
    Math.max(0, state.currentPathIndex),
    pattern.path.length - 1,
  )
  const ticksInsideCurrentCell = Math.max(0, state.ticksInsideCurrentCell)

  return {
    ...state,
    currentPathIndex,
    ticksInsideCurrentCell,
    activeCellId: pattern.path[currentPathIndex] ?? null,
  }
}

export function advancePlaybackState(
  pattern: DiamondPattern,
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
