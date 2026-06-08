import { DiamondCell } from './DiamondCell'
import type { CellId, DiamondCells } from '../lib/rhythm/types'

const diamondGridCells: CellId[] = [
  'top',
  'upperRight',
  'middleRight',
  'upperLeft',
  'centre',
  'lowerRight',
  'middleLeft',
  'lowerLeft',
  'bottom',
]

type DiamondGridProps = {
  cells: DiamondCells
  path: CellId[]
  activeCellId: CellId | null
  selectedCellId: CellId
  onCellClick: (cellId: CellId) => void
}

export function DiamondGrid({
  cells,
  path,
  activeCellId,
  selectedCellId,
  onCellClick,
}: DiamondGridProps) {
  return (
    <div className="diamond-grid-shell">
      <div className="diamond-grid" aria-label="Unified 9-section diamond grid">
        {diamondGridCells.map((cellId) => {
          const pathPosition = path.indexOf(cellId)
          const pathCount = path.filter((pathCellId) => pathCellId === cellId).length

          return (
            <DiamondCell
              key={cellId}
              cellId={cellId}
              value={cells[cellId]}
              isActive={activeCellId === cellId}
              isSelected={selectedCellId === cellId}
              pathPosition={pathPosition >= 0 ? pathPosition + 1 : null}
              pathCount={pathCount}
              onClick={onCellClick}
            />
          )
        })}
      </div>
    </div>
  )
}
