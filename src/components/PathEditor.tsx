import { CELL_VALUE_MAX, CELL_VALUE_MIN } from '../lib/rhythm/constants'
import type { CellId } from '../lib/rhythm/types'

const pathDiamondCells: CellId[] = [
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

type PathEditorProps = {
  path: CellId[]
  pathText: string
  selectedCellId: CellId
  selectedCellValue: number
  onPathCellClick: (cellId: CellId) => void
  onCellValueChange: (value: number) => void
  onUndoPathStep: () => void
  onClearPath: () => void
}

export function PathEditor({
  path,
  pathText,
  selectedCellId,
  selectedCellValue,
  onPathCellClick,
  onCellValueChange,
  onUndoPathStep,
  onClearPath,
}: PathEditorProps) {
  return (
    <section className="control-group path-editor" aria-label="Path editor" aria-describedby="path-editor-description">
      <h2>Path</h2>
      <p id="path-editor-description" className="visually-hidden">
        {pathText}
      </p>
      <div className="mini-path-shell" aria-label="Mini diamond path editor">
        <div className="mini-path-grid">
          {pathDiamondCells.map((cellId) => {
            const firstIndex = path.indexOf(cellId)
            const hasMarker = firstIndex >= 0

            return (
              <button
                key={cellId}
                type="button"
                className="mini-path-cell"
                data-has-marker={hasMarker}
                aria-disabled={hasMarker}
                onClick={() => onPathCellClick(cellId)}
                aria-label={
                  hasMarker
                    ? `${cellId} is already path step ${firstIndex + 1}`
                    : `Add ${cellId} to path`
                }
              >
                <span className="mini-path-content">
                  {hasMarker && <span className="mini-path-marker">{firstIndex + 1}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="button-row">
        <button type="button" onClick={onUndoPathStep} disabled={path.length === 0}>
          Undo path step
        </button>
        <button type="button" onClick={onClearPath} disabled={path.length === 0}>
          Clear path
        </button>
      </div>

      <div className="selected-cell-editor">
        <h2>Selected cell</h2>
        <p>{selectedCellId}</p>
        <div className="stepper" aria-label={`Value editor for ${selectedCellId}`}>
          <button
            type="button"
            onClick={() => onCellValueChange(selectedCellValue - 1)}
            disabled={selectedCellValue <= CELL_VALUE_MIN}
            aria-label={`Decrease ${selectedCellId} value`}
          >
            -
          </button>
          <output aria-label={`${selectedCellId} value`}>{selectedCellValue}</output>
          <button
            type="button"
            onClick={() => onCellValueChange(selectedCellValue + 1)}
            disabled={selectedCellValue >= CELL_VALUE_MAX}
            aria-label={`Increase ${selectedCellId} value`}
          >
            +
          </button>
        </div>
        <p className="message">Use a whole number from 1 to 15.</p>
      </div>
    </section>
  )
}
