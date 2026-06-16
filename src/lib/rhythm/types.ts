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

export type SoundLayer = 'stomp' | 'subdivision' | 'accent' | 'cycleAccent'

export type CellCutSettings = {
  enabled: boolean
  multiplier: 2
  phrase: number[]
}

export type CellSettings = {
  value: number
  cut?: CellCutSettings
}

export type CellData = number | CellSettings

export type DiamondCells = Record<CellId, CellData>

export type DiamondPattern = {
  id: string
  name: string
  cells: DiamondCells
  path: CellId[]
}

export type PlayablePattern = {
  id: string
  name: string
  cells: Record<string, CellData>
  path: string[]
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
  activeCellId: string | null
}

export type TickEvents = {
  globalTick: number
  stomp: boolean
  subdivision: boolean
  accent: boolean
  cycleAccent: boolean
  activeCellId: string | null
  currentPathIndex: number
  ticksInsideCurrentCell: number
}
