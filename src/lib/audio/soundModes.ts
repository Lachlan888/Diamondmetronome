export type SoundMode = 'cajon' | 'oscillator' | 'body'

export type SoundModeDefinition = {
  id: SoundMode
  name: string
  description: string
  type: 'generated' | 'sample'
  basePath?: string
}

export const soundModes: SoundModeDefinition[] = [
  {
    id: 'cajon',
    name: 'Cajon',
    description: 'Acoustic cajon hits for a groove-like feel.',
    type: 'sample',
    basePath: '/sounds/cajon',
  },
  {
    id: 'oscillator',
    name: 'Oscillator',
    description: 'Clean generated tones for timing checks.',
    type: 'generated',
  },
  {
    id: 'body',
    name: 'Body Percussion',
    description: 'Foot, tap and clap sounds.',
    type: 'sample',
    basePath: '/sounds/body',
  },
]

export const SOUND_MODE_STORAGE_KEY = 'diamond-metronome:sound-mode'

export function getSoundModeDefinition(soundMode: SoundMode): SoundModeDefinition {
  return soundModes.find((definition) => definition.id === soundMode) ?? soundModes[0]
}

export function isSoundMode(value: unknown): value is SoundMode {
  return typeof value === 'string' && soundModes.some((definition) => definition.id === value)
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function loadSavedSoundMode(): SoundMode | null {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    const savedValue = window.localStorage.getItem(SOUND_MODE_STORAGE_KEY)
    return isSoundMode(savedValue) ? savedValue : null
  } catch {
    return null
  }
}

export function saveSoundMode(soundMode: SoundMode): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(SOUND_MODE_STORAGE_KEY, soundMode)
  } catch {
    // Ignore restricted storage contexts.
  }
}
