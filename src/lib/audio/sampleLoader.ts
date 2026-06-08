import type { SoundLayer } from '../rhythm/types'
import type { SoundModeDefinition } from './soundModes'

export type SampleBuffers = Record<SoundLayer, AudioBuffer>

const sampleFileNames: Record<SoundLayer, string> = {
  stomp: 'stomp.wav',
  subdivision: 'subdivision.wav',
  accent: 'accent.wav',
  cycleAccent: 'cycle-accent.wav',
}

const sampleCache = new Map<string, SampleBuffers>()

export async function loadSampleBuffers(
  audioContext: AudioContext,
  soundModeDefinition: SoundModeDefinition,
): Promise<SampleBuffers> {
  if (soundModeDefinition.type !== 'sample' || soundModeDefinition.basePath === undefined) {
    throw new Error(`${soundModeDefinition.name} is not a sample sound mode.`)
  }

  const cachedBuffers = sampleCache.get(soundModeDefinition.id)

  if (cachedBuffers !== undefined) {
    return cachedBuffers
  }

  const entries = await Promise.all(
    Object.entries(sampleFileNames).map(async ([layer, fileName]) => {
      const response = await fetch(`${soundModeDefinition.basePath}/${fileName}`)

      if (!response.ok) {
        throw new Error(`Could not load ${soundModeDefinition.name} sample: ${fileName}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      return [layer, audioBuffer] as const
    }),
  )
  const buffers = Object.fromEntries(entries) as SampleBuffers

  sampleCache.set(soundModeDefinition.id, buffers)

  return buffers
}
