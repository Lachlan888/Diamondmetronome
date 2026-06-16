import type { CellId } from '../lib/rhythm/types'
import type { CellData } from '../lib/rhythm/types'
import { getCellCut, getCellValue } from '../lib/rhythm/cells'

type DiamondCellProps = {
  cellId: CellId
  value: CellData
  isActive: boolean
  isSelected: boolean
  pathPosition: number | null
  pathCount: number
  onClick: (cellId: CellId) => void
}

export function DiamondCell({
  cellId,
  value,
  isActive,
  isSelected,
  pathPosition,
  pathCount,
  onClick,
}: DiamondCellProps) {
  const cellValue = getCellValue(value) ?? 0
  const cut = getCellCut(value)
  const stateLabel = [
    isActive ? 'active' : null,
    isSelected ? 'selected' : null,
    pathPosition !== null
      ? `path position ${pathPosition}${pathCount > 1 ? `, used ${pathCount} times` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      className="diamond-cell"
      data-active={isActive}
      data-selected={isSelected}
      data-cut={cut !== null}
      onClick={() => onClick(cellId)}
      aria-pressed={isSelected}
      aria-label={`${cellId} cell, value ${cellValue}${cut ? `, cut ${cellValue * 2}` : ''}${stateLabel ? `, ${stateLabel}` : ''}`}
    >
      <span className="cell-content">
        <span className="cell-value">{cellValue}</span>
        {cut && <span className="cut-badge">×2</span>}
      </span>
    </button>
  )
}
