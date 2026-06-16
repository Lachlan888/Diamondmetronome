import { CELL_VALUE_MAX, CELL_VALUE_MIN } from './constants'
import { getCellCut } from './cells'
import type { CellCutSettings, PlayablePattern } from './types'
import { clampCellValue } from './validation'

export const FREE_MAP_RADIUS = 36
export const FREE_MAP_GRID_SIDE = FREE_MAP_RADIUS * 2 + 1
export const FREE_MAP_SEED_CELL_ID = getFreeMapCellId(0, 0)

export type FreeMapRouteMode = 'forward' | 'thereBack'
export type FreeMapTool = 'mark' | 'value' | 'path'
export type FreeMapCellId = string

export type FreeMapCell = {
  id: FreeMapCellId
  x: number
  y: number
  value: number
  cut?: CellCutSettings
}

export type FreeMapPattern = {
  id: string
  name: string
  cells: Record<FreeMapCellId, FreeMapCell>
  selectedCellId: FreeMapCellId
  outboundPath: FreeMapCellId[]
  routeMode: FreeMapRouteMode
}

export function getFreeMapCellId(x: number, y: number): FreeMapCellId {
  return `${x}:${y}`
}

export function parseFreeMapCellId(cellId: FreeMapCellId) {
  const [xValue, yValue] = cellId.split(':').map(Number)

  return {
    x: Number.isFinite(xValue) ? xValue : 0,
    y: Number.isFinite(yValue) ? yValue : 0,
  }
}

export function isFreeMapCoordinateInBounds(x: number, y: number) {
  return Math.abs(x) <= FREE_MAP_RADIUS && Math.abs(y) <= FREE_MAP_RADIUS
}

export function getFreeMapGridCells() {
  const gridCells: Array<{ id: FreeMapCellId; x: number; y: number }> = []

  for (let y = -FREE_MAP_RADIUS; y <= FREE_MAP_RADIUS; y += 1) {
    for (let x = -FREE_MAP_RADIUS; x <= FREE_MAP_RADIUS; x += 1) {
      if (isFreeMapCoordinateInBounds(x, y)) {
        gridCells.push({ id: getFreeMapCellId(x, y), x, y })
      }
    }
  }

  return gridCells
}

export function areFreeMapCellsAdjacent(leftCellId: FreeMapCellId, rightCellId: FreeMapCellId) {
  const left = parseFreeMapCellId(leftCellId)
  const right = parseFreeMapCellId(rightCellId)
  const xDistance = Math.abs(left.x - right.x)
  const yDistance = Math.abs(left.y - right.y)

  return xDistance <= 1 && yDistance <= 1 && xDistance + yDistance > 0
}

export function getAdjacentFreeMapCellIds(cellId: FreeMapCellId) {
  const { x, y } = parseFreeMapCellId(cellId)
  const candidates = [
    [x, y - 1],
    [x + 1, y - 1],
    [x + 1, y],
    [x + 1, y + 1],
    [x, y + 1],
    [x - 1, y + 1],
    [x - 1, y],
    [x - 1, y - 1],
  ]

  return candidates
    .filter(([candidateX, candidateY]) => isFreeMapCoordinateInBounds(candidateX, candidateY))
    .map(([candidateX, candidateY]) => getFreeMapCellId(candidateX, candidateY))
}

export function canActivateFreeMapCell(pattern: FreeMapPattern, cellId: FreeMapCellId) {
  if (pattern.cells[cellId]) {
    return false
  }

  const activeCellIds = Object.keys(pattern.cells)

  return activeCellIds.length === 0 || activeCellIds.some((activeCellId) => areFreeMapCellsAdjacent(activeCellId, cellId))
}

export function isFreeMapConnectedAfterRemoving(pattern: FreeMapPattern, cellIdToRemove: FreeMapCellId) {
  const remainingCellIds = Object.keys(pattern.cells).filter((cellId) => cellId !== cellIdToRemove)

  if (remainingCellIds.length <= 1) {
    return true
  }

  const visited = new Set<FreeMapCellId>()
  const queue = [remainingCellIds[0]]
  visited.add(remainingCellIds[0])

  while (queue.length > 0) {
    const currentCellId = queue.shift() as FreeMapCellId

    getAdjacentFreeMapCellIds(currentCellId).forEach((adjacentCellId) => {
      if (adjacentCellId !== cellIdToRemove && pattern.cells[adjacentCellId] && !visited.has(adjacentCellId)) {
        visited.add(adjacentCellId)
        queue.push(adjacentCellId)
      }
    })
  }

  return visited.size === remainingCellIds.length
}

export function getFreeMapPlaybackPath(pattern: FreeMapPattern) {
  if (pattern.routeMode === 'thereBack') {
    return [...pattern.outboundPath, ...pattern.outboundPath.slice().reverse()]
  }

  return pattern.outboundPath
}

export function getFreeMapPlaybackStepCount(pattern: FreeMapPattern) {
  return getFreeMapPlaybackPath(pattern).length
}

export function toPlayableFreeMapPattern(pattern: FreeMapPattern): PlayablePattern {
  const cells = Object.fromEntries(
    Object.values(pattern.cells).map((cell) => [
      cell.id,
      getCellCut(cell)
        ? {
            value: clampCellValue(cell.value),
            cut: getCellCut(cell) ?? undefined,
          }
        : clampCellValue(cell.value),
    ]),
  )

  return {
    id: pattern.id,
    name: pattern.name,
    cells,
    path: getFreeMapPlaybackPath(pattern).filter((cellId) => cells[cellId] !== undefined),
  }
}

function createFreeMapCell(x: number, y: number, value: number): FreeMapCell {
  const id = getFreeMapCellId(x, y)

  return {
    id,
    x,
    y,
    value: Math.min(CELL_VALUE_MAX, Math.max(CELL_VALUE_MIN, value)),
  }
}

export function createBlankFreeMapPattern(): FreeMapPattern {
  const centre = createFreeMapCell(0, 0, 2)

  return {
    id: 'free-map-blank-centre',
    name: 'Blank centre',
    cells: {
      [centre.id]: centre,
    },
    selectedCellId: centre.id,
    outboundPath: [],
    routeMode: 'forward',
  }
}
