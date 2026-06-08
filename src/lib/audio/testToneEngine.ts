import type { RhythmSettings, SoundLayer, TickEvents } from '../rhythm/types'
import { loadSampleBuffers, type SampleBuffers } from './sampleLoader'
import { getSoundModeDefinition, type SoundMode } from './soundModes'

type BrowserAudioContext = typeof AudioContext

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: BrowserAudioContext
}

type ToneShape = {
  frequency: number
  endFrequency?: number
  duration: number
  gainMultiplier: number
  type: OscillatorType
}

const toneShapes = {
  stomp: {
    frequency: 92,
    endFrequency: 48,
    duration: 0.09,
    gainMultiplier: 0.42,
    type: 'sine',
  },
  subdivision: {
    frequency: 880,
    duration: 0.035,
    gainMultiplier: 0.18,
    type: 'triangle',
  },
  accent: {
    frequency: 440,
    duration: 0.07,
    gainMultiplier: 0.34,
    type: 'square',
  },
  cycleAccent: {
    frequency: 330,
    duration: 0.085,
    gainMultiplier: 0.38,
    type: 'sawtooth',
  },
} satisfies Record<SoundLayer, ToneShape>

export type SoundModeStatus = {
  activeMode: SoundMode
  requestedMode: SoundMode
  message: string
}

export type TestToneEngine = {
  getCurrentTime: () => number
  resume: () => Promise<void>
  setSoundMode: (soundMode: SoundMode) => Promise<SoundModeStatus>
  getSoundModeStatus: () => SoundModeStatus
  scheduleTick: (events: TickEvents, settings: RhythmSettings, scheduledTime: number) => void
}

export function createTestToneEngine(): TestToneEngine {
  const AudioContextConstructor =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext

  if (!AudioContextConstructor) {
    throw new Error('Web Audio is not available in this browser.')
  }

  const audioContext = new AudioContextConstructor()
  let activeSoundMode: SoundMode = 'oscillator'
  let requestedSoundMode: SoundMode = 'oscillator'
  let sampleBuffers: SampleBuffers | null = null
  let currentStatus: SoundModeStatus = {
    activeMode: 'oscillator',
    requestedMode: 'oscillator',
    message: 'Sound mode: Oscillator',
  }

  function scheduleTone(shape: ToneShape, volume: number, scheduledTime: number) {
    if (volume <= 0 || audioContext.state !== 'running') {
      return
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const initialGain = Math.max(0.0001, volume * shape.gainMultiplier)
    const startTime = Math.max(audioContext.currentTime, scheduledTime)
    const endTime = startTime + shape.duration

    oscillator.type = shape.type
    oscillator.frequency.setValueAtTime(shape.frequency, startTime)

    if (shape.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, shape.endFrequency),
        endTime,
      )
    }

    gainNode.gain.setValueAtTime(initialGain, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start(startTime)
    oscillator.stop(endTime)
  }

  function scheduleSample(buffer: AudioBuffer, volume: number, scheduledTime: number) {
    if (volume <= 0 || audioContext.state !== 'running') {
      return
    }

    const sourceNode = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    const startTime = Math.max(audioContext.currentTime, scheduledTime)

    sourceNode.buffer = buffer
    gainNode.gain.setValueAtTime(Math.max(0, volume), startTime)
    sourceNode.connect(gainNode)
    gainNode.connect(audioContext.destination)
    sourceNode.start(startTime)
  }

  function scheduleLayer(layer: SoundLayer, settings: RhythmSettings, scheduledTime: number) {
    const volume = settings.soundVolumes[layer]

    if (activeSoundMode !== 'oscillator' && sampleBuffers !== null) {
      scheduleSample(sampleBuffers[layer], volume, scheduledTime)
      return
    }

    scheduleTone(toneShapes[layer], volume, scheduledTime)
  }

  async function setSoundMode(soundMode: SoundMode): Promise<SoundModeStatus> {
    requestedSoundMode = soundMode
    const soundModeDefinition = getSoundModeDefinition(soundMode)

    if (soundModeDefinition.type === 'generated') {
      activeSoundMode = soundMode
      sampleBuffers = null
      currentStatus = {
        activeMode: activeSoundMode,
        requestedMode: requestedSoundMode,
        message: `Sound mode: ${soundModeDefinition.name}`,
      }
      return currentStatus
    }

    try {
      sampleBuffers = await loadSampleBuffers(audioContext, soundModeDefinition)
      activeSoundMode = soundMode
      currentStatus = {
        activeMode: activeSoundMode,
        requestedMode: requestedSoundMode,
        message: `Sound mode: ${soundModeDefinition.name}`,
      }
    } catch {
      activeSoundMode = 'oscillator'
      sampleBuffers = null
      currentStatus = {
        activeMode: activeSoundMode,
        requestedMode: requestedSoundMode,
        message: `${soundModeDefinition.name} sounds unavailable. Using Oscillator mode.`,
      }
    }

    return currentStatus
  }

  return {
    getCurrentTime: () => audioContext.currentTime,
    resume: () => audioContext.resume(),
    setSoundMode,
    getSoundModeStatus: () => currentStatus,
    scheduleTick: (events, settings, scheduledTime) => {
      // Sound mode changes only how the prioritized layer is rendered; timing stays in the scheduler.
      if (events.cycleAccent && settings.soundToggles.cycleAccent) {
        scheduleLayer('cycleAccent', settings, scheduledTime)
      } else if (events.accent && settings.soundToggles.accent) {
        scheduleLayer('accent', settings, scheduledTime)
      } else if (settings.soundToggles.subdivision) {
        scheduleLayer('subdivision', settings, scheduledTime)
      }

      if (events.stomp && settings.soundToggles.stomp) {
        scheduleLayer('stomp', settings, scheduledTime)
      }
    },
  }
}
