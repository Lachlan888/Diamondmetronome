import type { RhythmSettings, TickEvents } from '../rhythm/types'

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
} satisfies Record<'stomp' | 'subdivision' | 'accent', ToneShape>

export type TestToneEngine = {
  getCurrentTime: () => number
  resume: () => Promise<void>
  scheduleTick: (events: TickEvents, settings: RhythmSettings, scheduledTime: number) => void
}

export function createTestToneEngine(): TestToneEngine {
  const AudioContextConstructor =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext

  if (!AudioContextConstructor) {
    throw new Error('Web Audio is not available in this browser.')
  }

  const audioContext = new AudioContextConstructor()

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

  return {
    getCurrentTime: () => audioContext.currentTime,
    resume: () => audioContext.resume(),
    scheduleTick: (events, settings, scheduledTime) => {
      // Temporary oscillator test sounds. Replace with body-percussion sample loading in the Web Audio scheduling pass.
      if (events.accent && settings.soundToggles.accent) {
        scheduleTone(toneShapes.accent, settings.soundVolumes.accent, scheduledTime)
      } else if (settings.soundToggles.subdivision) {
        scheduleTone(toneShapes.subdivision, settings.soundVolumes.subdivision, scheduledTime)
      }

      if (events.stomp && settings.soundToggles.stomp) {
        scheduleTone(toneShapes.stomp, settings.soundVolumes.stomp, scheduledTime)
      }
    },
  }
}
