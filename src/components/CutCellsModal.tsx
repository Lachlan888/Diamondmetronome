import { useEffect, useMemo, useState } from 'react'
import {
  CUT_PHRASE_UNIT_MAX,
  getCutPhraseTotal,
  getDefaultCutPhrase,
  parseCutPhrase,
} from '../lib/rhythm/cells'
import type { CellCutSettings } from '../lib/rhythm/types'

export type CutEditableCell = {
  id: string
  label: string
  value: number
  cut: CellCutSettings | null
}

type CutCellsModalProps = {
  cells: CutEditableCell[]
  mode: 'diamond' | 'freeMap'
  onCutChange: (cellId: string, cut: CellCutSettings | null) => void
  onClearCuts: () => void
}

type PhraseDraft = {
  phrase: number[]
  text: string
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

function formatPhrase(phrase: number[]) {
  return phrase.join('+')
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
    text: formatPhrase(phrase),
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
  const selectedCell = cellsById.get(selectedCellId) ?? cells[0] ?? null
  const selectedDraft = selectedCell
    ? drafts[selectedCell.id] ?? getInitialDraft(selectedCell)
    : { phrase: [], text: '' }
  const targetTotal = selectedCell ? selectedCell.value * 2 : 0
  const phraseStatus = getPhraseStatus(selectedDraft.phrase, targetTotal)

  useEffect(() => {
    setDrafts(Object.fromEntries(cells.map((cell) => [cell.id, getInitialDraft(cell)])))
  }, [cells])

  useEffect(() => {
    if (selectedCellId === '' || !cellsById.has(selectedCellId)) {
      setSelectedCellId(cells[0]?.id ?? '')
    }
  }, [cells, cellsById, selectedCellId])

  function updateDraft(cellId: string, phrase: number[]) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [cellId]: {
        phrase,
        text: formatPhrase(phrase),
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

  function handleTextChange(text: string) {
    if (!selectedCell) {
      return
    }

    const parsedPhrase = parseCutPhrase(text)

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedCell.id]: {
        phrase: parsedPhrase ?? currentDrafts[selectedCell.id]?.phrase ?? [],
        text,
      },
    }))

    if (parsedPhrase === null) {
      setMessage(`Use phrase units from 1 to ${CUT_PHRASE_UNIT_MAX}.`)
      return
    }

    setMessage(null)
  }

  function renderOverviewCell(cell: CutEditableCell) {
    const phraseLabel = cell.cut ? formatPhrase(cell.cut.phrase) : 'no cut'

    return (
      <button
        type="button"
        className="cut-mini-cell"
        data-cut={cell.cut !== null}
        data-selected={selectedCell?.id === cell.id}
        key={cell.id}
        onClick={() => setSelectedCellId(cell.id)}
        aria-pressed={selectedCell?.id === cell.id}
        aria-label={`${cell.label}, value ${cell.value}, ${phraseLabel}`}
      >
        <span className="cut-mini-cell-inner">
          <strong>{cell.label}</strong>
          <span>{cell.value}</span>
          {cell.cut && <em>{phraseLabel}</em>}
        </span>
      </button>
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
              {cells.map(renderOverviewCell)}
            </div>
          )}
        </section>

        <section className="cut-selected-editor" aria-label="Selected cut cell editor">
          {selectedCell ? (
            <>
              <header className="cut-selected-header">
                <div>
                  <span>Selected cell</span>
                  <h3>{selectedCell.label}</h3>
                </div>
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
                {phraseUnits.map((unit) => (
                  <button
                    type="button"
                    key={unit}
                    disabled={phraseStatus.total + unit > targetTotal}
                    onClick={() => updateDraft(selectedCell.id, [...selectedDraft.phrase, unit])}
                  >
                    {unit}
                  </button>
                ))}
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

              <label className="field compact-field cut-phrase-text">
                <span>Typed phrase</span>
                <input
                  type="text"
                  value={selectedDraft.text}
                  onBlur={() => {
                    const parsedPhrase = parseCutPhrase(selectedDraft.text)

                    if (parsedPhrase !== null) {
                      applyPhrase(selectedCell, parsedPhrase)
                    }
                  }}
                  onChange={(event) => handleTextChange(event.target.value)}
                  aria-label={`${selectedCell.label} typed cut phrase`}
                />
              </label>
            </>
          ) : (
            <p>No cells available.</p>
          )}
        </section>
      </div>
    </section>
  )
}
