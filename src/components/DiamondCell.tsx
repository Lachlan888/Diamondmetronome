import type { CellId } from '../lib/rhythm/types'

type DiamondCellProps = {
  cellId: CellId
  value: number
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
      onClick={() => onClick(cellId)}
      aria-pressed={isSelected}
      aria-label={`${cellId} cell, value ${value}${stateLabel ? `, ${stateLabel}` : ''}`}
    >
      <span className="cell-content">
        <span className="cell-value">{value}</span>
      </span>
    </button>
  )
}
