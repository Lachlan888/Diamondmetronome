import type { CellId, SoundLayer } from './types'

export const BPM_MIN = 30
export const BPM_MAX = 480

export const CELL_VALUE_MIN = 1
export const CELL_VALUE_MAX = 15

export const ALLOWED_STOMP_INTERVALS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export const CELL_IDS: CellId[] = [
  'top',
  'upperLeft',
  'upperRight',
  'middleLeft',
  'centre',
  'middleRight',
  'lowerLeft',
  'lowerRight',
  'bottom',
]

export const SOUND_LAYERS: SoundLayer[] = ['stomp', 'subdivision', 'accent']
