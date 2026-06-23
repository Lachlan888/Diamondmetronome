import {
  advancePlaybackState,
  createInitialPlaybackState,
  getTickEvents,
  normalizePlaybackStateForPattern,
} from '../rhythm/engine'
import { getCellCut, getCellValue } from '../rhythm/cells'
import type { PlaybackState, PlayablePattern, RhythmSettings, TickEvents } from '../rhythm/types'
import type { TestToneEngine } from './testToneEngine'

export const SCHEDULER_INTERVAL_MS = 25
export const SCHEDULE_AHEAD_SECONDS = 0.1
const HIDDEN_SCHEDULER_INTERVAL_MS = 250
const HIDDEN_SCHEDULE_AHEAD_SECONDS = 2.5

export type ScheduledTick = {
  tickEvents: TickEvents
  playbackState: PlaybackState
  scheduledAudioTime: number
}

type SchedulerOptions = {
  toneEngine: TestToneEngine
  pattern: PlayablePattern
  settings: RhythmSettings
  onTickScheduled: (tick: ScheduledTick) => void
}

export type RhythmScheduler = {
  start: () => void
  stop: () => PlaybackState
  reset: (pattern?: PlayablePattern) => PlaybackState
  updateSettings: (settings: RhythmSettings) => void
  updatePattern: (pattern: PlayablePattern) => PlaybackState
  getPlaybackState: () => PlaybackState
  isRunning: () => boolean
}

function getSubdivisionTickSeconds(settings: RhythmSettings) {
  return 60 / settings.bpm
}

function getCutPhraseStartOffsets(phrase: number[]) {
  let cursor = 0

  return [
    0,
    ...phrase.slice(0, -1).map((phrasePart) => {
      cursor += phrasePart
      return cursor
    }),
  ]
}

export function createRhythmScheduler({
  toneEngine,
  pattern: initialPattern,
  settings: initialSettings,
  onTickScheduled,
}: SchedulerOptions): RhythmScheduler {
  let pattern = initialPattern
  let settings = initialSettings
  let playbackState = createInitialPlaybackState(pattern)
  let nextTickTime = 0
  let intervalId: number | null = null

  function isDocumentHidden() {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden'
  }

  function getSchedulerIntervalMs() {
    return isDocumentHidden() ? HIDDEN_SCHEDULER_INTERVAL_MS : SCHEDULER_INTERVAL_MS
  }

  function getScheduleAheadSeconds() {
    // Background tabs throttle JS timers, so queue a longer Web Audio window while hidden.
    return isDocumentHidden() ? HIDDEN_SCHEDULE_AHEAD_SECONDS : SCHEDULE_AHEAD_SECONDS
  }

  function startLoop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId)
    }

    intervalId = window.setInterval(schedulerPass, getSchedulerIntervalMs())
  }

  function handleVisibilityChange() {
    if (intervalId === null) {
      return
    }

    schedulerPass()
    startLoop()
  }

  function stopLoop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId)
      intervalId = null
    }

    document.removeEventListener('visibilitychange', handleVisibilityChange)

    playbackState = {
      ...playbackState,
      isPlaying: false,
    }

    return playbackState
  }

  function schedulerPass() {
    const currentTime = toneEngine.getCurrentTime()
    const scheduleUntil = currentTime + getScheduleAheadSeconds()

    while (nextTickTime <= scheduleUntil) {
      const tickEvents = getTickEvents(pattern, settings, playbackState)
      const tickPlaybackState = {
        ...playbackState,
        isPlaying: true,
      }

      toneEngine.scheduleTick(tickEvents, settings, nextTickTime)

      const activeCell = playbackState.activeCellId === null ? undefined : pattern.cells[playbackState.activeCellId]
      const activeCellValue = getCellValue(activeCell)
      const cut = getCellCut(activeCell)

      if (cut !== null && activeCellValue !== null) {
        const currentCutTick = playbackState.ticksInsideCurrentCell * cut.multiplier
        const nextCutTick = currentCutTick + cut.multiplier
        const cutTickSeconds = getSubdivisionTickSeconds(settings) / cut.multiplier
        const phraseStartOffsets = new Set(getCutPhraseStartOffsets(cut.phrase))

        for (let cutOffset = currentCutTick; cutOffset < nextCutTick; cutOffset += 1) {
          if (cutOffset < activeCellValue * cut.multiplier) {
            toneEngine.scheduleCutAccent(
              settings,
              nextTickTime + (cutOffset - currentCutTick) * cutTickSeconds,
              phraseStartOffsets.has(cutOffset) ? 0.62 : 0.34,
            )
          }
        }
      }

      onTickScheduled({
        tickEvents,
        playbackState: tickPlaybackState,
        scheduledAudioTime: nextTickTime,
      })

      playbackState = {
        ...advancePlaybackState(pattern, playbackState),
        isPlaying: true,
      }
      nextTickTime += getSubdivisionTickSeconds(settings)
    }
  }

  return {
    start: () => {
      if (intervalId !== null || pattern.path.length === 0) {
        return
      }

      playbackState = {
        ...playbackState,
        activeCellId: playbackState.activeCellId ?? pattern.path[0] ?? null,
        isPlaying: true,
      }
      nextTickTime = toneEngine.getCurrentTime()
      schedulerPass()
      document.addEventListener('visibilitychange', handleVisibilityChange)
      startLoop()
    },
    stop: stopLoop,
    reset: (nextPattern = pattern) => {
      stopLoop()
      pattern = nextPattern
      playbackState = createInitialPlaybackState(pattern)
      nextTickTime = toneEngine.getCurrentTime()
      return playbackState
    },
    updateSettings: (nextSettings) => {
      settings = nextSettings
    },
    updatePattern: (nextPattern) => {
      pattern = nextPattern
      playbackState = normalizePlaybackStateForPattern(pattern, playbackState)
      return playbackState
    },
    getPlaybackState: () => playbackState,
    isRunning: () => intervalId !== null,
  }
}
