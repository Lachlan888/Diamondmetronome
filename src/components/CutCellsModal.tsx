import { useMemo, useState, type CSSProperties } from 'react'
import {
  CUT_PHRASE_UNIT_MAX,
  getCutPhraseTotal,
  getDefaultCutPhrase,
} from '../lib/rhythm/cells'
import type { CellCutSettings } from '../lib/rhythm/types'

export type CutEditableCell = {
  id: string
  label: string
  value: number
  cut: CellCutSettings | null
  x?: number
  y?: number
  pathOrder?: number
  pathCount?: number
}

type CutCellsModalProps = {
  cells: CutEditableCell[]
  mode: 'diamond' | 'freeMap'
  onCutChange: (cellId: string, cut: CellCutSettings | null) => void
  onClearCuts: () => void
}

type PhraseDraft = {
  phrase: number[]
}

const phraseUnits = Array.from({ length: CUT_PHRASE_UNIT_MAX }, (_, index) => index + 1)
const miniDiamondOrder = [
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

type TableCutCell = {
  cell: CutEditableCell | null
  column: number
  row: number
  id: string
}

type CutCellTable = {
  cells: TableCutCell[]
  columns: number
  rows: number
  cellSize: number
  gap: number
}

function formatCutPhrase(phrase: number[] | undefined): string {
  if (!phrase || phrase.length === 0) {
    return ''
  }

  return phrase.join('+')
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function createCut(phrase: number[]): CellCutSettings {
  return {
    enabled: true,
    multiplier: 2,
    phrase,
  }
}

function getEvenPhrase(targetTotal: number) {
  for (let unit = Math.min(CUT_PHRASE_UNIT_MAX, targetTotal); unit >= 1; unit -= 1) {
    if (targetTotal % unit === 0) {
      return Array.from({ length: targetTotal / unit }, () => unit)
    }
  }

  return []
}

function getInitialDraft(cell: CutEditableCell): PhraseDraft {
  const phrase = cell.cut?.phrase ?? getDefaultCutPhrase(cell.value)

  return {
    phrase,
  }
}

function getPhraseStatus(phrase: number[], targetTotal: number) {
  const total = getCutPhraseTotal(phrase)
  const remaining = targetTotal - total

  return {
    total,
    remaining,
    isValid: phrase.length > 0 && total === targetTotal,
  }
}

function getCutCellTable(cells: CutEditableCell[]): CutCellTable | null {
  const tableCells = cells.filter(
    (cell): cell is CutEditableCell & { x: number; y: number } =>
      typeof cell.x === 'number' &&
      Number.isFinite(cell.x) &&
      typeof cell.y === 'number' &&
      Number.isFinite(cell.y),
  )

  if (tableCells.length === 0) {
    return null
  }

  const minX = Math.min(...tableCells.map((cell) => cell.x))
  const maxX = Math.max(...tableCells.map((cell) => cell.x))
  const minY = Math.min(...tableCells.map((cell) => cell.y))
  const maxY = Math.max(...tableCells.map((cell) => cell.y))
  const paddingCells = 1
  const startX = minX - paddingCells
  const endX = maxX + paddingCells
  const startY = minY - paddingCells
  const endY = maxY + paddingCells
  const columns = endX - startX + 1
  const rows = endY - startY + 1
  const largestAxis = Math.max(columns, rows)
  const cellSize = Math.max(24, Math.min(46, Math.floor(300 / largestAxis)))
  const cellsByCoordinate = new Map(tableCells.map((cell) => [`${cell.x}:${cell.y}`, cell]))
  const positionedCells: TableCutCell[] = []

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const coordinateId = `${x}:${y}`

      positionedCells.push({
        cell: cellsByCoordinate.get(coordinateId) ?? null,
        column: x - startX + 1,
        row: y - startY + 1,
        id: coordinateId,
      })
    }
  }

  return {
    cells: positionedCells,
    columns,
    rows,
    cellSize,
    gap: 0,
  }
}

export function CutCellsModal({
  cells,
  mode,
  onCutChange,
  onClearCuts,
}: CutCellsModalProps) {
  const [selectedCellId, setSelectedCellId] = useState(cells[0]?.id ?? '')
  const [drafts, setDrafts] = useState<Record<string, PhraseDraft>>({})
  const [message, setMessage] = useState<string | null>(null)
  const cellsById = useMemo(() => new Map(cells.map((cell) => [cell.id, cell])), [cells])
  const resolvedSelectedCellId = selectedCellId !== '' && cellsById.has(selectedCellId)
    ? selectedCellId
    : cells[0]?.id ?? ''
  const selectedCell = cellsById.get(resolvedSelectedCellId) ?? null
  const selectedDraft = selectedCell
    ? drafts[selectedCell.id] ?? getInitialDraft(selectedCell)
    : { phrase: [] }
  const targetTotal = selectedCell ? selectedCell.value * 2 : 0
  const phraseStatus = getPhraseStatus(selectedDraft.phrase, targetTotal)
  const remainingPhraseTotal = Math.max(0, phraseStatus.remaining)
  const visiblePhraseUnits = phraseUnits.filter((unit) => unit <= Math.min(CUT_PHRASE_UNIT_MAX, remainingPhraseTotal))
  const cutCellTable = useMemo(() => getCutCellTable(cells), [cells])

  function updateDraft(cellId: string, phrase: number[]) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [cellId]: {
        phrase,
      },
    }))
  }

  function applyPhrase(cell: CutEditableCell, phrase: number[]) {
    const requiredTotal = cell.value * 2
    const total = getCutPhraseTotal(phrase)

    if (phrase.length === 0) {
      setMessage(`Cut phrase for ${cell.label} needs at least one unit.`)
      return
    }

    if (phrase.some((unit) => unit < 1 || unit > CUT_PHRASE_UNIT_MAX)) {
      setMessage(`Each phrase unit must be between 1 and ${CUT_PHRASE_UNIT_MAX}.`)
      return
    }

    if (total !== requiredTotal) {
      setMessage(`Cut phrase for ${cell.label} must total ${requiredTotal}.`)
      return
    }

    onCutChange(cell.id, createCut(phrase))
    setMessage(null)
  }

  function handleCutToggle(enabled: boolean) {
    if (!selectedCell) {
      return
    }

    if (!enabled) {
      onCutChange(selectedCell.id, null)
      setMessage(null)
      return
    }

    const phrase = selectedCell.cut?.phrase ?? getDefaultCutPhrase(selectedCell.value)
    updateDraft(selectedCell.id, phrase)
    applyPhrase(selectedCell, phrase)
  }

  function renderOverviewCell(cell: CutEditableCell) {
    const isSelected = selectedCell?.id === cell.id
    const shouldPreviewDraft = isSelected && cell.cut !== null
    const previewPhrase = shouldPreviewDraft ? selectedDraft.phrase : cell.cut?.phrase
    const committedPhraseLabel = formatCutPhrase(cell.cut?.phrase)
    const previewPhraseLabel = formatCutPhrase(previewPhrase)
    const phraseLabel = previewPhraseLabel || committedPhraseLabel
    const hasVisibleCut = cell.cut !== null

    return (
      <button
        type="button"
        className="cut-mini-cell"
        data-cut={hasVisibleCut}
        data-selected={isSelected}
        key={cell.id}
        onClick={() => setSelectedCellId(cell.id)}
        aria-pressed={isSelected}
        aria-label={`${cell.label}, value ${cell.value}, ${phraseLabel || 'no cut'}`}
      >
        <span className="cut-mini-cell-inner">
          <span>{cell.value}</span>
          {phraseLabel && <em>{phraseLabel}</em>}
          {cell.pathOrder !== undefined && (
            <small className="cut-mini-path-badge">
              {cell.pathOrder}
              {cell.pathCount && cell.pathCount > 1 ? `+${cell.pathCount - 1}` : ''}
            </small>
          )}
        </span>
      </button>
    )
  }

  function renderTableCell({ cell, column, row, id }: TableCutCell) {
    return (
      <div
        className="cut-mini-map-position"
        key={id}
        style={{
          gridColumn: column,
          gridRow: row,
        } as CSSProperties}
      >
        {cell ? renderOverviewCell(cell) : <span className="cut-mini-map-empty" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <section className="cut-cells-panel modal-contained-content" aria-label="Cut Cells editor">
      <div className="cut-cells-actions">
        <p>Choose a cell, then edit one focused cut phrase.</p>
        <button type="button" onClick={onClearCuts}>
          Clear cuts
        </button>
      </div>

      {message && <p className="message warning">{message}</p>}

      <div className="cut-cells-layout">
        <section className="cut-cell-overview" aria-label="Cut cell overview">
          {mode === 'diamond' ? (
            <div className="cut-mini-diamond" aria-label="Mini diamond cut cell selector">
              {miniDiamondOrder
                .map((cellId) => cellsById.get(cellId))
                .filter((cell): cell is CutEditableCell => cell !== undefined)
                .map(renderOverviewCell)}
            </div>
          ) : (
            <div className="cut-mini-map" aria-label="Free Map cut cell selector">
              {cutCellTable ? (
                <div
                  className="cut-mini-map-table"
                  style={{
                    '--cut-map-columns': cutCellTable.columns,
                    '--cut-map-rows': cutCellTable.rows,
                    '--cut-map-cell-size': `${cutCellTable.cellSize}px`,
                    '--cut-map-gap': `${cutCellTable.gap}px`,
                    '--cut-cell-value-font-size': `${clampNumber(cutCellTable.cellSize * 0.42, 10, 28)}px`,
                    '--cut-cell-badge-font-size': `${clampNumber(cutCellTable.cellSize * 0.22, 7, 14)}px`,
                  } as CSSProperties}
                >
                  {cutCellTable.cells.map(renderTableCell)}
                </div>
              ) : (
                cells.map(renderOverviewCell)
              )}
            </div>
          )}
        </section>

        <section className="cut-selected-editor" aria-label="Selected cut cell editor">
          {selectedCell ? (
            <>
              <header className="cut-selected-header">
                <label className="cut-enabled-toggle">
                  <input
                    type="checkbox"
                    checked={selectedCell.cut !== null}
                    onChange={(event) => handleCutToggle(event.target.checked)}
                  />
                  <span>Cut</span>
                </label>
              </header>

              <dl className="cut-selected-stats">
                <div>
                  <dt>Value</dt>
                  <dd>{selectedCell.value}</dd>
                </div>
                <div>
                  <dt>Cut total</dt>
                  <dd>{targetTotal}</dd>
                </div>
              </dl>

              <div className="cut-phrase-chips" aria-label={`${selectedCell.label} phrase`}>
                {selectedDraft.phrase.length > 0 ? (
                  selectedDraft.phrase.map((unit, index) => (
                    <span className="cut-phrase-chip" key={`${selectedCell.id}-${index}`}>
                      {unit}
                    </span>
                  ))
                ) : (
                  <span className="cut-phrase-empty">No units</span>
                )}
              </div>

              <div className="cut-phrase-status" data-valid={phraseStatus.isValid}>
                <span>Total: {phraseStatus.total} / {targetTotal}</span>
                <span>Remaining: {Math.max(0, phraseStatus.remaining)}</span>
                <span>{phraseStatus.isValid ? 'Ready' : phraseStatus.remaining < 0 ? 'Too long' : 'Incomplete'}</span>
              </div>

              <div className="cut-phrase-buttons" aria-label={`${selectedCell.label} phrase unit buttons`}>
                {visiblePhraseUnits.length > 0 ? (
                  visiblePhraseUnits.map((unit) => (
                    <button
                      type="button"
                      key={unit}
                      onClick={() => updateDraft(selectedCell.id, [...selectedDraft.phrase, unit])}
                    >
                      {unit}
                    </button>
                  ))
                ) : (
                  <span className="cut-phrase-complete">Phrase total reached</span>
                )}
              </div>

              <div className="cut-phrase-tools">
                <button
                  type="button"
                  disabled={selectedDraft.phrase.length === 0}
                  onClick={() => updateDraft(selectedCell.id, selectedDraft.phrase.slice(0, -1))}
                >
                  Backspace
                </button>
                <button type="button" onClick={() => updateDraft(selectedCell.id, [])}>
                  Clear
                </button>
                <button type="button" onClick={() => updateDraft(selectedCell.id, getEvenPhrase(targetTotal))}>
                  Even
                </button>
                <button type="button" onClick={() => updateDraft(selectedCell.id, getDefaultCutPhrase(selectedCell.value))}>
                  Halves
                </button>
                <button
                  type="button"
                  disabled={!phraseStatus.isValid}
                  onClick={() => applyPhrase(selectedCell, selectedDraft.phrase)}
                >
                  Apply
                </button>
              </div>
            </>
          ) : (
            <p>No cells available.</p>
          )}
        </section>
      </div>
    </section>
  )
}
