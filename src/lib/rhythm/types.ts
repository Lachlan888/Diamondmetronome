export type CellId =
  | 'top'
  | 'upperLeft'
  | 'upperRight'
  | 'middleLeft'
  | 'centre'
  | 'middleRight'
  | 'lowerLeft'
  | 'lowerRight'
  | 'bottom'

export type SoundLayer = 'stomp' | 'subdivision' | 'accent'

export type DiamondCells = Record<CellId, number>

export type DiamondPattern = {
  id: string
  name: string
  cells: DiamondCells
  path: CellId[]
}

export type RhythmSettings = {
  bpm: number
  stompInterval: number
  soundToggles: Record<SoundLayer, boolean>
  soundVolumes: Record<SoundLayer, number>
}

export type PlaybackState = {
  isPlaying: boolean
  globalTick: number
  currentPathIndex: number
  ticksInsideCurrentCell: number
  activeCellId: CellId | null
}

export type TickEvents = {
  globalTick: number
  stomp: boolean
  subdivision: boolean
  accent: boolean
  activeCellId: CellId | null
  currentPathIndex: number
  ticksInsideCurrentCell: number
}
