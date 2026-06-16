import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { CELL_VALUE_MAX, CELL_VALUE_MIN } from '../lib/rhythm/constants'
import { getCellCut } from '../lib/rhythm/cells'
import {
  canActivateFreeMapCell,
  FREE_MAP_GRID_SIDE,
  FREE_MAP_RADIUS,
  getFreeMapGridCells,
  getFreeMapPlaybackStepCount,
  isFreeMapConnectedAfterRemoving,
  type FreeMapCellId,
  type FreeMapPattern,
  type FreeMapRouteMode,
  type FreeMapTool,
} from '../lib/rhythm/freeMap'

type FreeMapEditorProps = {
  view?: 'controls' | 'field' | 'full'
  pattern: FreeMapPattern
  tool: FreeMapTool
  activeCellId: string | null
  message: string | null
  onToolChange: (tool: FreeMapTool) => void
  onRouteChange: (routeMode: FreeMapRouteMode) => void
  onSelectCell: (cellId: FreeMapCellId) => void
  onActivateCell: (cellId: FreeMapCellId) => void
  onRemoveSelectedCell: () => void
  onClearMap: () => void
  onCellValueChange: (value: number) => void
  onAppendPathCell: (cellId: FreeMapCellId) => void
  onUndoPathStep: () => void
  onClearPath: () => void
}

const gridCells = getFreeMapGridCells()
const FREE_MAP_ZOOM_MIN = 50
const FREE_MAP_ZOOM_MAX = 200
const FREE_MAP_ZOOM_STEP = 10
const FREE_MAP_CELL_SIZE = 28
const FREE_MAP_GRID_SIZE = FREE_MAP_GRID_SIDE * FREE_MAP_CELL_SIZE

function getToolLabel(tool: FreeMapTool) {
  if (tool === 'mark') {
    return 'Mark'
  }

  if (tool === 'value') {
    return 'Value'
  }

  return 'Path'
}

function getRouteLabel(routeMode: FreeMapRouteMode) {
  return routeMode === 'thereBack' ? 'There and Back Again' : 'Forward Loop'
}

function clampFreeMapZoom(zoomPercent: number) {
  return Math.min(FREE_MAP_ZOOM_MAX, Math.max(FREE_MAP_ZOOM_MIN, zoomPercent))
}

export function FreeMapEditor({
  view = 'full',
  pattern,
  tool,
  activeCellId,
  message,
  onToolChange,
  onRouteChange,
  onSelectCell,
  onActivateCell,
  onRemoveSelectedCell,
  onClearMap,
  onCellValueChange,
  onAppendPathCell,
  onUndoPathStep,
  onClearPath,
}: FreeMapEditorProps) {
  const [zoomPercent, setZoomPercent] = useState(100)
  const [fitPan, setFitPan] = useState({ x: 0, y: 0 })
  const fieldPanelRef = useRef<HTMLElement | null>(null)
  const cellButtonRefsRef = useRef<Record<FreeMapCellId, HTMLButtonElement | null>>({})
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    panX: number
    panY: number
    didMove: boolean
    cellId: FreeMapCellId | null
  } | null>(null)
  const suppressCellClickRef = useRef(false)
  const selectedCell = pattern.cells[pattern.selectedCellId]
  const activeCellCount = Object.keys(pattern.cells).length
  const hasCentreSeed = pattern.cells['0:0'] !== undefined
  const canRemoveSelected =
    selectedCell !== undefined &&
    activeCellCount > 1 &&
    isFreeMapConnectedAfterRemoving(pattern, pattern.selectedCellId)

  useEffect(() => {
    if (activeCellCount === 1 && hasCentreSeed && pattern.outboundPath.length === 0) {
      setZoomPercent(100)
      setFitPan({ x: 0, y: 0 })
    }
  }, [activeCellCount, hasCentreSeed, pattern.outboundPath.length])

  function performCellAction(cellId: FreeMapCellId) {
    const isActive = pattern.cells[cellId] !== undefined

    if (tool === 'mark') {
      if (isActive) {
        onSelectCell(cellId)
      } else {
        onActivateCell(cellId)
      }

      return
    }

    if (tool === 'value') {
      if (isActive) {
        onSelectCell(cellId)
      }

      return
    }

    if (isActive) {
      onAppendPathCell(cellId)
    }
  }

  function handleCellClick(cellId: FreeMapCellId) {
    if (suppressCellClickRef.current) {
      suppressCellClickRef.current = false
      return
    }

    performCellAction(cellId)
  }

  function handleZoomChange(nextZoomPercent: number) {
    setZoomPercent(clampFreeMapZoom(nextZoomPercent))
  }

  function centerCellInViewport(cellId: FreeMapCellId) {
    const fieldPanel = fieldPanelRef.current
    const cellButton = cellButtonRefsRef.current[cellId]

    if (!fieldPanel || !cellButton) {
      return
    }

    const fieldPanelRect = fieldPanel.getBoundingClientRect()
    const cellRect = cellButton.getBoundingClientRect()
    const fieldPanelCenterX = fieldPanelRect.left + fieldPanelRect.width / 2
    const fieldPanelCenterY = fieldPanelRect.top + fieldPanelRect.height / 2
    const cellCenterX = cellRect.left + cellRect.width / 2
    const cellCenterY = cellRect.top + cellRect.height / 2
    const viewportScaleX = fieldPanel.offsetWidth > 0 ? fieldPanelRect.width / fieldPanel.offsetWidth : 1
    const viewportScaleY = fieldPanel.offsetHeight > 0 ? fieldPanelRect.height / fieldPanel.offsetHeight : 1

    setFitPan((currentPan) => ({
      x: currentPan.x + (fieldPanelCenterX - cellCenterX) / viewportScaleX,
      y: currentPan.y + (fieldPanelCenterY - cellCenterY) / viewportScaleY,
    }))
  }

  function centerFreeMapCanvas() {
    const startCellId = pattern.outboundPath[0] ?? pattern.selectedCellId

    if (startCellId === '0:0') {
      setFitPan({ x: 0, y: 0 })
      return
    }

    centerCellInViewport(startCellId)
  }

  function handleCanvasPointerDown(event: PointerEvent<HTMLElement>) {
    const target = event.target instanceof Element ? event.target : null
    const cellElement = target?.closest('.free-map-cell') as HTMLElement | null

    if (
      target?.closest('.free-map-zoom-controls') ||
      target?.closest(".free-map-cell[data-active='true']")
    ) {
      return
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: fitPan.x,
      panY: fitPan.y,
      didMove: false,
      cellId: cellElement?.dataset.cellId ?? null,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCanvasPointerMove(event: PointerEvent<HTMLElement>) {
    const dragState = dragStateRef.current

    if (dragState === null || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    const fieldPanel = fieldPanelRef.current
    const fieldPanelRect = fieldPanel?.getBoundingClientRect()
    const viewportScaleX = fieldPanel && fieldPanelRect && fieldPanel.offsetWidth > 0
      ? fieldPanelRect.width / fieldPanel.offsetWidth
      : 1
    const viewportScaleY = fieldPanel && fieldPanelRect && fieldPanel.offsetHeight > 0
      ? fieldPanelRect.height / fieldPanel.offsetHeight
      : 1

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragState.didMove = true
    }

    setFitPan({
      x: dragState.panX + deltaX / viewportScaleX,
      y: dragState.panY + deltaY / viewportScaleY,
    })
  }

  function handleCanvasPointerUp(event: PointerEvent<HTMLElement>) {
    const dragState = dragStateRef.current

    if (dragState === null || dragState.pointerId !== event.pointerId) {
      return
    }

    suppressCellClickRef.current = true

    if (!dragState.didMove && dragState.cellId) {
      performCellAction(dragState.cellId)
    }

    window.setTimeout(() => {
      suppressCellClickRef.current = false
    })
    dragStateRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const controls = (
      <section className="control-group free-map-tools" aria-label="Free Map controls">
        <h2>Free Map</h2>

        <fieldset className="segmented free-map-tool-switch">
          <legend>Tool</legend>
          <div className="segmented-options">
            {(['mark', 'value', 'path'] as const).map((toolOption) => (
              <label key={toolOption}>
                <input
                  type="radio"
                  name="free-map-tool"
                  checked={tool === toolOption}
                  onChange={() => onToolChange(toolOption)}
                />
                <span>{getToolLabel(toolOption)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="segmented free-map-route-switch">
          <legend>Route</legend>
          <div className="segmented-options two-options">
            {(['forward', 'thereBack'] as const).map((routeOption) => (
              <label key={routeOption}>
                <input
                  type="radio"
                  name="free-map-route"
                  checked={pattern.routeMode === routeOption}
                  onChange={() => onRouteChange(routeOption)}
                />
                <span>{getRouteLabel(routeOption)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <dl className="free-map-stats">
          <div>
            <dt>Active cells</dt>
            <dd>{activeCellCount}</dd>
          </div>
          <div>
            <dt>Outbound steps</dt>
            <dd>{pattern.outboundPath.length}</dd>
          </div>
          <div>
            <dt>Playback steps</dt>
            <dd>{getFreeMapPlaybackStepCount(pattern)}</dd>
          </div>
        </dl>

        <div className="button-row wrap">
          <button type="button" onClick={onRemoveSelectedCell} disabled={!canRemoveSelected}>
            Remove selected
          </button>
          <button type="button" onClick={onClearMap}>
            Clear map
          </button>
        </div>

        <div className="button-row wrap">
          <button type="button" onClick={onUndoPathStep} disabled={pattern.outboundPath.length === 0}>
            Undo path step
          </button>
          <button type="button" onClick={onClearPath} disabled={pattern.outboundPath.length === 0}>
            Clear path
          </button>
        </div>

        {selectedCell && (
          <div className="selected-cell-editor">
            <h2>Selected cell</h2>
            <p>{selectedCell.id}</p>
            <div className="stepper" aria-label={`Value editor for ${selectedCell.id}`}>
              <button
                type="button"
                onClick={() => onCellValueChange(selectedCell.value - 1)}
                disabled={selectedCell.value <= CELL_VALUE_MIN}
                aria-label={`Decrease ${selectedCell.id} value`}
              >
                -
              </button>
              <output aria-label={`${selectedCell.id} value`}>{selectedCell.value}</output>
              <button
                type="button"
                onClick={() => onCellValueChange(selectedCell.value + 1)}
                disabled={selectedCell.value >= CELL_VALUE_MAX}
                aria-label={`Increase ${selectedCell.id} value`}
              >
                +
              </button>
            </div>
          </div>
        )}

        {message && <p className="message warning">{message}</p>}
      </section>
  )

  const field = (
      <section
        ref={fieldPanelRef}
        className="free-map-field-panel beat-pulse-surface"
        aria-label="Free Map rhythm field"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        <div className="free-map-zoom-controls" aria-label="Free Map zoom controls">
          <span>Zoom</span>
          <button type="button" onClick={() => handleZoomChange(zoomPercent - FREE_MAP_ZOOM_STEP)}>
            -
          </button>
          <output aria-label="Free Map zoom">{zoomPercent}%</output>
          <button type="button" onClick={() => handleZoomChange(zoomPercent + FREE_MAP_ZOOM_STEP)}>
            +
          </button>
          <button type="button" onClick={centerFreeMapCanvas}>
            Centre
          </button>
        </div>
        <div
          className="free-map-field"
          aria-label="Free Map grid"
          style={{
            '--free-map-cell-size': `${FREE_MAP_CELL_SIZE}px`,
            left: `calc(50% + ${fitPan.x}px)`,
            top: `calc(50% + ${fitPan.y}px)`,
            width: `${FREE_MAP_GRID_SIZE}px`,
            height: `${FREE_MAP_GRID_SIZE}px`,
            gridTemplateColumns: `repeat(${FREE_MAP_GRID_SIDE}, var(--free-map-cell-size))`,
            gridTemplateRows: `repeat(${FREE_MAP_GRID_SIDE}, var(--free-map-cell-size))`,
            transform: `translate(-50%, -50%) scale(${zoomPercent / 100}) rotate(45deg)`,
          } as CSSProperties}
        >
            {gridCells.map(({ id, x, y }) => {
              const activeCell = pattern.cells[id]
              const isActive = activeCell !== undefined
              const cut = getCellCut(activeCell)
              const isSelected = pattern.selectedCellId === id
              const firstPathIndex = pattern.outboundPath.indexOf(id)
              const pathCount = pattern.outboundPath.filter((pathCellId) => pathCellId === id).length
              const isLegalMark = tool === 'mark' && !isActive && canActivateFreeMapCell(pattern, id)

              return (
                <button
                  type="button"
                  className="free-map-cell"
                  ref={(buttonElement) => {
                    cellButtonRefsRef.current[id] = buttonElement
                  }}
                  data-active={isActive}
                  data-selected={isSelected}
                  data-playing={activeCellId === id}
                  data-cut={cut !== null}
                  data-legal-mark={isLegalMark}
                  data-cell-id={id}
                  key={id}
                  onClick={() => handleCellClick(id)}
                  style={{
                    gridColumn: x + FREE_MAP_RADIUS + 1,
                    gridRow: y + FREE_MAP_RADIUS + 1,
                  }}
                  aria-label={
                    isActive
                      ? `Free Map cell ${id}, value ${activeCell.value}${cut ? `, cut ${activeCell.value * 2}` : ''}${isSelected ? ', selected' : ''}`
                      : `Inactive Free Map cell ${id}`
                  }
                >
                  <span className="free-map-cell-value">{isActive ? activeCell.value : ''}</span>
                  {cut && <span className="free-map-cut-badge">×2</span>}
                  {firstPathIndex >= 0 && (
                    <span className="free-map-path-badge">
                      {firstPathIndex + 1}
                      {pathCount > 1 ? `+${pathCount - 1}` : ''}
                    </span>
                  )}
                </button>
              )
            })}
        </div>

      </section>
  )

  if (view === 'controls') {
    return controls
  }

  if (view === 'field') {
    return field
  }

  return (
    <section className="free-map-workspace" aria-label="Free Map editor">
      {controls}
      {field}
    </section>
  )
}
