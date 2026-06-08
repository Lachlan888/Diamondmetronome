import type { DiamondPattern, RhythmSettings } from './types'

export const defaultPattern: DiamondPattern = {
  id: 'default-2-3-diamond',
  name: 'Default 2/3 Diamond',
  cells: {
    top: 2,
    upperLeft: 3,
    upperRight: 3,
    middleLeft: 3,
    centre: 2,
    middleRight: 3,
    lowerLeft: 3,
    lowerRight: 3,
    bottom: 2,
  },
  path: [
    'top',
    'upperRight',
    'middleRight',
    'upperLeft',
    'centre',
    'lowerRight',
    'middleLeft',
    'lowerLeft',
    'bottom',
  ],
}

export const defaultSettings: RhythmSettings = {
  bpm: 90,
  stompInterval: 4,
  soundToggles: {
    stomp: true,
    subdivision: true,
    accent: true,
  },
  soundVolumes: {
    stomp: 0.8,
    subdivision: 0.45,
    accent: 0.75,
  },
}
