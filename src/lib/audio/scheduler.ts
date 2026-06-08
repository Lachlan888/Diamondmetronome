import {
  advancePlaybackState,
  createInitialPlaybackState,
  getTickEvents,
  normalizePlaybackStateForPattern,
} from '../rhythm/engine'
import type { DiamondPattern, PlaybackState, RhythmSettings, TickEvents } from '../rhythm/types'
import type { TestToneEngine } from './testToneEngine'

export const SCHEDULER_INTERVAL_MS = 25
export const SCHEDULE_AHEAD_SECONDS = 0.1

export type ScheduledTick = {
  tickEvents: TickEvents
  playbackState: PlaybackState
  scheduledAudioTime: number
}

type SchedulerOptions = {
  toneEngine: TestToneEngine
  pattern: DiamondPattern
  settings: RhythmSettings
  onTickScheduled: (tick: ScheduledTick) => void
}

export type RhythmScheduler = {
  start: () => void
  stop: () => PlaybackState
  reset: (pattern?: DiamondPattern) => PlaybackState
  updateSettings: (settings: RhythmSettings) => void
  updatePattern: (pattern: DiamondPattern) => PlaybackState
  getPlaybackState: () => PlaybackState
  isRunning: () => boolean
}

function getSubdivisionTickSeconds(settings: RhythmSettings) {
  return 60 / settings.bpm
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

  function stopLoop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId)
      intervalId = null
    }

    playbackState = {
      ...playbackState,
      isPlaying: false,
    }

    return playbackState
  }

  function schedulerPass() {
    const currentTime = toneEngine.getCurrentTime()
    const scheduleUntil = currentTime + SCHEDULE_AHEAD_SECONDS

    while (nextTickTime <= scheduleUntil) {
      const tickEvents = getTickEvents(pattern, settings, playbackState)
      const tickPlaybackState = {
        ...playbackState,
        isPlaying: true,
      }

      toneEngine.scheduleTick(tickEvents, settings, nextTickTime)
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
      intervalId = window.setInterval(schedulerPass, SCHEDULER_INTERVAL_MS)
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
