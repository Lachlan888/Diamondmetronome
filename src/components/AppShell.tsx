import { useEffect, useMemo, useRef, useState } from 'react'
import { DiamondGrid } from './DiamondGrid'
import { DiamondLibraryControls } from './DiamondLibraryControls'
import { DiamondToolsModal } from './DiamondToolsModal'
import { CutCellsModal, type CutEditableCell } from './CutCellsModal'
import { FreeMapEditor } from './FreeMapEditor'
import { CycleLengthPanel } from './CycleLengthPanel'
import { PathEditor } from './PathEditor'
import { RhythmLanes } from './RhythmLanes'
import { SoundControls } from './SoundControls'
import { TimingControls } from './TimingControls'
import { TransportControls } from './TransportControls'
import { createInitialPlaybackState, getCurrentCellValue } from '../lib/rhythm/engine'
import { getCycleLength } from '../lib/rhythm/cycleLength'
import { createRhythmScheduler, type RhythmScheduler, type ScheduledTick } from '../lib/audio/scheduler'
import { createTestToneEngine, type TestToneEngine } from '../lib/audio/testToneEngine'
import {
  loadSavedSoundMode,
  saveSoundMode,
  type SoundMode,
} from '../lib/audio/soundModes'
import {
  createPatternFromDiamondPair,
  DIAMOND_PAIR_MAX,
  diamondPairsUpToFifteen,
  getDiamondPairById,
} from '../lib/rhythm/diamondLibrary'
import { defaultPattern, defaultSettings } from '../lib/rhythm/patterns'
import { defaultRandomDiamondOptions, generateRandomDiamond } from '../lib/rhythm/randomDiamond'
import { CELL_VALUE_MAX, CELL_VALUE_MIN } from '../lib/rhythm/constants'
import { getCellCut, getCellValue, normalizeCellSettings } from '../lib/rhythm/cells'
import {
  createBlankFreeMapPattern,
  FREE_MAP_SEED_CELL_ID,
  toPlayableFreeMapPattern,
  canActivateFreeMapCell,
  isFreeMapConnectedAfterRemoving,
  type FreeMapPattern,
  type FreeMapRouteMode,
  type FreeMapTool,
} from '../lib/rhythm/freeMap'
import type {
  CellCutSettings,
  CellId,
  DiamondPattern,
  PlaybackState,
  PlayablePattern,
  RhythmSettings,
  SoundLayer,
} from '../lib/rhythm/types'
import { clampBpm, clampCellValue, isValidCellId } from '../lib/rhythm/validation'

const EMPTY_PATH_MESSAGE = 'Add at least one cell to the path.'
const FREE_MAP_EMPTY_PATH_MESSAGE = 'Add at least one active cell to the path.'
const CELL_ENTRY_BUFFER_MS = 800

type AppMode = 'diamond' | 'freeMap'

function restartForPattern(pattern: PlayablePattern): PlaybackState {
  return createInitialPlaybackState(pattern)
}

function getInitialSoundMode(): SoundMode {
  return loadSavedSoundMode() ?? 'cajon'
}

function toPlayableDiamondPattern(pattern: DiamondPattern): PlayablePattern {
  return {
    id: pattern.id,
    name: pattern.name,
    cells: pattern.cells,
    path: pattern.path,
  }
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest('.diamond-cell, .mini-path-cell, .free-map-cell')) {
    return false
  }

  return target.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"])') !== null
}

export function AppShell() {
  const testToneEngineRef = useRef<TestToneEngine | null>(null)
  const schedulerRef = useRef<RhythmScheduler | null>(null)
  const openDiamondToolsButtonRef = useRef<HTMLButtonElement | null>(null)
  const openCutCellsButtonRef = useRef<HTMLButtonElement | null>(null)
  const visualTimeoutIdsRef = useRef<number[]>([])
  const cellEntryBufferRef = useRef('')
  const cellEntryTimeoutRef = useRef<number | null>(null)
  const diamondToolsOpenRef = useRef(false)
  const appModeRef = useRef<AppMode>('diamond')
  const handleCellValueChangeRef = useRef<(nextValue: number) => void>(() => {})
  const handleFreeMapRemoveSelectedCellRef = useRef<() => void>(() => {})
  const [pattern, setPattern] = useState<DiamondPattern>(defaultPattern)
  const [appMode, setAppMode] = useState<AppMode>('diamond')
  const [freeMapPattern, setFreeMapPattern] = useState<FreeMapPattern>(() => createBlankFreeMapPattern())
  const [freeMapTool, setFreeMapTool] = useState<FreeMapTool>('mark')
  const [freeMapMessage, setFreeMapMessage] = useState<string | null>(null)
  const [settings, setSettings] = useState<RhythmSettings>(defaultSettings)
  const [selectedSoundMode, setSelectedSoundMode] = useState<SoundMode>(() => getInitialSoundMode())
  const [soundModeStatus, setSoundModeStatus] = useState<string | null>(null)
  const [selectedCellId, setSelectedCellId] = useState<CellId>('centre')
  const [selectedPairId, setSelectedPairId] = useState<string>(diamondPairsUpToFifteen[0]?.id ?? '')
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() =>
    createInitialPlaybackState(toPlayableDiamondPattern(defaultPattern)),
  )
  const [diamondToolsOpen, setDiamondToolsOpen] = useState(false)
  const [cutCellsOpen, setCutCellsOpen] = useState(false)
  const [beatPulse, setBeatPulse] = useState({ id: 0, isStomp: false })

  const diamondPlayablePattern = useMemo(() => toPlayableDiamondPattern(pattern), [pattern])
  const freeMapPlayablePattern = useMemo(() => toPlayableFreeMapPattern(freeMapPattern), [freeMapPattern])
  const playablePattern = appMode === 'diamond' ? diamondPlayablePattern : freeMapPlayablePattern
  const activeCellValue = getCurrentCellValue(playablePattern, playbackState)
  const pathIsValid = playablePattern.path.length > 0
  const emptyPathMessage = appMode === 'diamond' ? EMPTY_PATH_MESSAGE : FREE_MAP_EMPTY_PATH_MESSAGE
  const selectedCellValue = getCellValue(pattern.cells[selectedCellId]) ?? CELL_VALUE_MIN
  const selectedPair = getDiamondPairById(selectedPairId)
  const cycleLength = getCycleLength(playablePattern)
  const cutEditableCells = useMemo<CutEditableCell[]>(() => {
    if (appMode === 'diamond') {
      return Object.entries(pattern.cells).map(([cellId, cell]) => {
        const value = getCellValue(cell) ?? CELL_VALUE_MIN

        return {
          id: cellId,
          label: cellId,
          value,
          cut: getCellCut(cell),
        }
      })
    }

    return Object.values(freeMapPattern.cells)
      .sort((leftCell, rightCell) => leftCell.id.localeCompare(rightCell.id))
      .map((cell) => ({
        id: cell.id,
        label: cell.id,
        value: cell.value,
        cut: getCellCut(cell),
      }))
  }, [appMode, freeMapPattern.cells, pattern.cells])

  const currentPathText = useMemo(() => {
    if (pattern.path.length === 0) {
      return EMPTY_PATH_MESSAGE
    }

    return pattern.path.map((cellId, index) => `${index + 1}. ${cellId}`).join('  ')
  }, [pattern.path])

  function clearPendingVisualTimeouts() {
    visualTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    visualTimeoutIdsRef.current = []
  }

  function scheduleVisualUpdate({ tickEvents, playbackState: tickPlaybackState, scheduledAudioTime }: ScheduledTick) {
    const toneEngine = testToneEngineRef.current
    const delayMs = toneEngine
      ? Math.max(0, (scheduledAudioTime - toneEngine.getCurrentTime()) * 1000)
      : 0

    const timeoutId = window.setTimeout(() => {
      setPlaybackState(tickPlaybackState)
      setBeatPulse((currentPulse) => ({
        id: currentPulse.id + 1,
        isStomp: tickEvents.stomp,
      }))
      visualTimeoutIdsRef.current = visualTimeoutIdsRef.current.filter(
        (pendingTimeoutId) => pendingTimeoutId !== timeoutId,
      )
    }, delayMs)

    visualTimeoutIdsRef.current.push(timeoutId)
  }

  useEffect(() => {
    schedulerRef.current?.updateSettings(settings)
  }, [settings])

  useEffect(() => {
    diamondToolsOpenRef.current = diamondToolsOpen
  }, [diamondToolsOpen])

  useEffect(() => {
    appModeRef.current = appMode
  }, [appMode])

  useEffect(() => {
    handleCellValueChangeRef.current = handleSelectedValueChange
    handleFreeMapRemoveSelectedCellRef.current = handleFreeMapRemoveSelectedCell
  })

  useEffect(() => {
    function clearCellEntryBuffer() {
      cellEntryBufferRef.current = ''

      if (cellEntryTimeoutRef.current !== null) {
        window.clearTimeout(cellEntryTimeoutRef.current)
        cellEntryTimeoutRef.current = null
      }
    }

    function armCellEntryBufferReset() {
      if (cellEntryTimeoutRef.current !== null) {
        window.clearTimeout(cellEntryTimeoutRef.current)
      }

      cellEntryTimeoutRef.current = window.setTimeout(clearCellEntryBuffer, CELL_ENTRY_BUFFER_MS)
    }

    function handleCellEntryKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        diamondToolsOpenRef.current ||
        isEditableKeyboardTarget(event.target)
      ) {
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (appModeRef.current === 'freeMap') {
          event.preventDefault()
          handleFreeMapRemoveSelectedCellRef.current()
        }

        clearCellEntryBuffer()
        return
      }

      if (event.key === 'Escape') {
        clearCellEntryBuffer()
        return
      }

      if (!/^\d$/.test(event.key)) {
        return
      }

      event.preventDefault()

      const bufferedValue = `${cellEntryBufferRef.current}${event.key}`
      const nextValue = Number(bufferedValue)

      if (
        Number.isInteger(nextValue) &&
        nextValue >= CELL_VALUE_MIN &&
        nextValue <= CELL_VALUE_MAX
      ) {
        handleCellValueChangeRef.current(nextValue)
        cellEntryBufferRef.current = bufferedValue

        if (bufferedValue.length >= String(CELL_VALUE_MAX).length) {
          clearCellEntryBuffer()
        } else {
          armCellEntryBufferReset()
        }

        return
      }

      clearCellEntryBuffer()
    }

    window.addEventListener('keydown', handleCellEntryKeyDown)

    return () => {
      window.removeEventListener('keydown', handleCellEntryKeyDown)
      clearCellEntryBuffer()
    }
  }, [])

  useEffect(() => {
    saveSoundMode(selectedSoundMode)
    const toneEngine = testToneEngineRef.current

    if (toneEngine === null) {
      setSoundModeStatus(null)
      return
    }

    let isCancelled = false

    toneEngine.setSoundMode(selectedSoundMode).then((status) => {
      if (!isCancelled) {
        setSoundModeStatus(status.activeMode === status.requestedMode ? null : status.message)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [selectedSoundMode])

  useEffect(() => {
    return () => {
      schedulerRef.current?.stop()
      clearPendingVisualTimeouts()
    }
  }, [])

  function pausePlayback() {
    const stoppedState = schedulerRef.current?.stop()
    clearPendingVisualTimeouts()

    setPlaybackState((currentState) => ({
      ...(stoppedState ?? currentState),
      isPlaying: false,
    }))
  }

  function resetPlayback(nextPattern = playablePattern) {
    const initialState = schedulerRef.current?.reset(nextPattern) ?? restartForPattern(nextPattern)
    clearPendingVisualTimeouts()
    setPlaybackState(initialState)
  }

  async function handlePlay() {
    if (!pathIsValid) {
      pausePlayback()
      return
    }

    try {
      if (testToneEngineRef.current === null) {
        testToneEngineRef.current = createTestToneEngine()
      }

      await testToneEngineRef.current.resume()
      const nextSoundModeStatus = await testToneEngineRef.current.setSoundMode(selectedSoundMode)
      setSoundModeStatus(
        nextSoundModeStatus.activeMode === nextSoundModeStatus.requestedMode ? null : nextSoundModeStatus.message,
      )

      if (schedulerRef.current === null) {
        schedulerRef.current = createRhythmScheduler({
          toneEngine: testToneEngineRef.current,
          pattern: playablePattern,
          settings,
          onTickScheduled: scheduleVisualUpdate,
        })
      } else {
        schedulerRef.current.updateSettings(settings)
        schedulerRef.current.updatePattern(playablePattern)
      }

      clearPendingVisualTimeouts()
      schedulerRef.current.start()
    } catch {
      // Keep visual playback available even if the browser cannot create Web Audio.
      return
    }

    setPlaybackState((currentState) => ({
      ...currentState,
      isPlaying: true,
      activeCellId: currentState.activeCellId ?? playablePattern.path[0] ?? null,
    }))
  }

  function handlePause() {
    pausePlayback()
  }

  function handleStop() {
    resetPlayback()
  }

  function updatePattern(nextPattern: DiamondPattern) {
    const nextPlayablePattern = toPlayableDiamondPattern(nextPattern)
    const scheduler = schedulerRef.current
    const nextPlaybackState =
      scheduler === null || appMode !== 'diamond'
        ? restartForPattern(nextPlayablePattern)
        : scheduler.isRunning()
          ? scheduler.updatePattern(nextPlayablePattern)
          : scheduler.reset(nextPlayablePattern)
    clearPendingVisualTimeouts()
    setPattern(nextPattern)
    if (appMode === 'diamond') {
      setPlaybackState(nextPlaybackState)
    }
  }

  function updateCustomPath(nextPath: CellId[]) {
    updatePattern({
      ...pattern,
      path: nextPath,
    })
  }

  function appendUniqueCustomPathCell(cellId: CellId) {
    const currentPath = pattern.path

    if (currentPath.includes(cellId)) {
      return
    }

    updateCustomPath([...currentPath, cellId])
  }

  function handleCellClick(cellId: CellId) {
    setSelectedCellId(cellId)
    appendUniqueCustomPathCell(cellId)
  }

  function handlePathCellClick(cellId: CellId) {
    setSelectedCellId(cellId)
    appendUniqueCustomPathCell(cellId)
  }

  function handleCellValueChange(nextValue: number) {
    updatePattern({
      ...pattern,
      cells: {
        ...pattern.cells,
        [selectedCellId]: clampCellValue(nextValue),
      },
    })
  }

  function handleUndoPathStep() {
    updateCustomPath(pattern.path.slice(0, -1))
  }

  function handleClearPath() {
    updatePattern({
      ...pattern,
      path: [],
    })
  }

  function handleBpmChange(nextBpm: number) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      bpm: clampBpm(nextBpm),
    }))
  }

  function handleStompIntervalChange(nextStompInterval: number) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      stompInterval: nextStompInterval,
    }))
  }

  function handleSoundToggle(layer: SoundLayer, enabled: boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      soundToggles: {
        ...currentSettings.soundToggles,
        [layer]: enabled,
      },
    }))
  }

  function handleSoundVolumeChange(layer: SoundLayer, volume: number) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      soundVolumes: {
        ...currentSettings.soundVolumes,
        [layer]: volume,
      },
    }))
  }

  function handleSoundModeChange(nextSoundMode: SoundMode) {
    setSelectedSoundMode(nextSoundMode)
  }

  function updateFreeMapPattern(nextPattern: FreeMapPattern) {
    const nextPlayablePattern = toPlayableFreeMapPattern(nextPattern)
    const scheduler = schedulerRef.current
    const nextPlaybackState =
      scheduler === null || appMode !== 'freeMap'
        ? restartForPattern(nextPlayablePattern)
        : scheduler.isRunning()
          ? scheduler.updatePattern(nextPlayablePattern)
          : scheduler.reset(nextPlayablePattern)

    clearPendingVisualTimeouts()
    setFreeMapPattern(nextPattern)

    if (appMode === 'freeMap') {
      setPlaybackState(nextPlaybackState)
    }
  }

  function handleAppModeChange(nextMode: AppMode) {
    if (nextMode === appMode) {
      return
    }

    const nextPlayablePattern = nextMode === 'diamond' ? diamondPlayablePattern : freeMapPlayablePattern
    setAppMode(nextMode)
    setFreeMapMessage(null)
    resetPlayback(nextPlayablePattern)
  }

  function handleFreeMapActivateCell(cellId: string) {
    if (!canActivateFreeMapCell(freeMapPattern, cellId)) {
      setFreeMapMessage('Cells must connect to the map.')
      return
    }

    const nextCell = {
      id: cellId,
      ...(() => {
        const [x, y] = cellId.split(':').map(Number)
        return { x, y }
      })(),
      value: 2,
    }

    updateFreeMapPattern({
      ...freeMapPattern,
      cells: {
        ...freeMapPattern.cells,
        [cellId]: nextCell,
      },
      selectedCellId: cellId,
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapSelectCell(cellId: string) {
    if (!freeMapPattern.cells[cellId]) {
      return
    }

    setFreeMapPattern((currentPattern) => ({
      ...currentPattern,
      selectedCellId: cellId,
    }))
    setFreeMapMessage(null)
  }

  function handleFreeMapRemoveSelectedCell() {
    const cellId = freeMapPattern.selectedCellId
    const selectedCell = freeMapPattern.cells[cellId]

    if (!selectedCell) {
      return
    }

    if (cellId === FREE_MAP_SEED_CELL_ID) {
      updateFreeMapPattern({
        ...freeMapPattern,
        cells: {
          ...freeMapPattern.cells,
          [cellId]: {
            ...selectedCell,
            value: 2,
            cut: undefined,
          },
        },
        outboundPath: freeMapPattern.outboundPath.filter((pathCellId) => pathCellId !== cellId),
      })
      setFreeMapMessage(null)
      return
    }

    if (!isFreeMapConnectedAfterRemoving(freeMapPattern, cellId)) {
      setFreeMapMessage('That would split the map.')
      return
    }

    const nextCells = { ...freeMapPattern.cells }
    delete nextCells[cellId]
    const nextSelectedCellId = Object.keys(nextCells)[0] ?? cellId

    updateFreeMapPattern({
      ...freeMapPattern,
      cells: nextCells,
      selectedCellId: nextSelectedCellId,
      outboundPath: freeMapPattern.outboundPath.filter((pathCellId) => pathCellId !== cellId),
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapClearMap() {
    const blankMap = createBlankFreeMapPattern()
    updateFreeMapPattern(blankMap)
    setFreeMapMessage(null)
  }

  function handleFreeMapCellValueChange(nextValue: number) {
    const selectedCell = freeMapPattern.cells[freeMapPattern.selectedCellId]

    if (!selectedCell) {
      return
    }

    updateFreeMapPattern({
      ...freeMapPattern,
      cells: {
        ...freeMapPattern.cells,
        [selectedCell.id]: {
          ...selectedCell,
          value: clampCellValue(nextValue),
          cut: undefined,
        },
      },
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapAppendPathCell(cellId: string) {
    if (!freeMapPattern.cells[cellId]) {
      setFreeMapMessage('Draw a path through active cells.')
      return
    }

    updateFreeMapPattern({
      ...freeMapPattern,
      selectedCellId: cellId,
      outboundPath: [...freeMapPattern.outboundPath, cellId],
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapUndoPathStep() {
    updateFreeMapPattern({
      ...freeMapPattern,
      outboundPath: freeMapPattern.outboundPath.slice(0, -1),
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapClearPath() {
    updateFreeMapPattern({
      ...freeMapPattern,
      outboundPath: [],
    })
    setFreeMapMessage(null)
  }

  function handleFreeMapRouteChange(routeMode: FreeMapRouteMode) {
    updateFreeMapPattern({
      ...freeMapPattern,
      routeMode,
    })
    setFreeMapMessage(null)
  }

  function handleCutCellChange(cellId: string, cut: CellCutSettings | null) {
    if (appMode === 'diamond') {
      if (!isValidCellId(cellId)) {
        return
      }

      const currentCell = pattern.cells[cellId]
      const currentValue = getCellValue(currentCell) ?? CELL_VALUE_MIN

      updatePattern({
        ...pattern,
        cells: {
          ...pattern.cells,
          [cellId]: cut === null ? currentValue : { ...normalizeCellSettings(currentCell), cut },
        },
      })
      return
    }

    const currentCell = freeMapPattern.cells[cellId]

    if (!currentCell) {
      return
    }

    updateFreeMapPattern({
      ...freeMapPattern,
      cells: {
        ...freeMapPattern.cells,
        [cellId]: {
          ...currentCell,
          cut: cut ?? undefined,
        },
      },
    })
  }

  function handleClearCuts() {
    if (appMode === 'diamond') {
      updatePattern({
        ...pattern,
        cells: Object.fromEntries(
          Object.entries(pattern.cells).map(([cellId, cell]) => [
            cellId,
            getCellValue(cell) ?? CELL_VALUE_MIN,
          ]),
        ) as DiamondPattern['cells'],
      })
      return
    }

    updateFreeMapPattern({
      ...freeMapPattern,
      cells: Object.fromEntries(
        Object.values(freeMapPattern.cells).map((cell) => [
          cell.id,
          {
            ...cell,
            cut: undefined,
          },
        ]),
      ),
    })
  }

  function handleSelectedValueChange(nextValue: number) {
    if (appMode === 'freeMap') {
      handleFreeMapCellValueChange(nextValue)
      return
    }

    handleCellValueChange(nextValue)
  }

  function applyPatternFromDiamondMap(nextPattern: DiamondPattern) {
    setPattern(nextPattern)
    setSelectedCellId(nextPattern.path[0] ?? 'centre')
    if (appMode === 'diamond') {
      resetPlayback(toPlayableDiamondPattern(nextPattern))
    }
  }

  function handleGlobalReset() {
    schedulerRef.current?.updateSettings(defaultSettings)
    setSettings(defaultSettings)
    setSelectedSoundMode('cajon')
    setPattern(defaultPattern)
    setSelectedCellId(defaultPattern.path[0] ?? 'centre')
    setFreeMapPattern(createBlankFreeMapPattern())
    setFreeMapTool('mark')
    setFreeMapMessage(null)
    resetPlayback(appMode === 'diamond' ? toPlayableDiamondPattern(defaultPattern) : toPlayableFreeMapPattern(createBlankFreeMapPattern()))
  }

  function loadDiamondPair(numerator: number, denominator: number) {
    const normalizedNumerator = Math.floor(numerator)
    const normalizedDenominator = Math.floor(denominator)

    if (
      normalizedNumerator < 1 ||
      normalizedNumerator > DIAMOND_PAIR_MAX ||
      normalizedDenominator < 1 ||
      normalizedDenominator > DIAMOND_PAIR_MAX ||
      normalizedNumerator === normalizedDenominator
    ) {
      return
    }

    const pairId = `pair-${normalizedNumerator}-${normalizedDenominator}`
    const pair = getDiamondPairById(pairId)

    if (pair === null) {
      return
    }

    setSelectedPairId(pair.id)
    applyPatternFromDiamondMap(createPatternFromDiamondPair(pair))
  }

  function handleRandomDiamond() {
    const randomDiamond = generateRandomDiamond(defaultRandomDiamondOptions)
    setSelectedPairId(randomDiamond.pairId)
    applyPatternFromDiamondMap(randomDiamond.pattern)
  }

  return (
    <>
      <div className="app-viewport">
        <main className="app-shell app-scale-canvas">
          <header className="app-header">
            <h1>Diamond Metronome</h1>
          </header>

          <fieldset className="segmented mode-switch" aria-label="Mode">
            <legend className="visually-hidden">Mode</legend>
            <div className="segmented-options two-options">
              <label>
                <input
                  type="radio"
                  name="app-mode"
                  checked={appMode === 'diamond'}
                  onChange={() => handleAppModeChange('diamond')}
                />
                <span>Diamond</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="app-mode"
                  checked={appMode === 'freeMap'}
                  onChange={() => handleAppModeChange('freeMap')}
                />
                <span>Free Map</span>
              </label>
            </div>
          </fieldset>

          <section className="practice-area" aria-label="Diamond Metronome workspace">
            <aside className="annotation-panel transport-stack" aria-label="Playback and timing controls">
              <div className="annotation-note">
                <TransportControls
                  isPlaying={playbackState.isPlaying}
                  pathIsValid={pathIsValid}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onStop={handleStop}
                  onReset={handleGlobalReset}
                />
              </div>

              {!pathIsValid && <p className="message warning">{emptyPathMessage}</p>}

              <div className="annotation-note">
                <TimingControls
                  bpm={settings.bpm}
                  stompInterval={settings.stompInterval}
                  onBpmChange={handleBpmChange}
                  onStompIntervalChange={handleStompIntervalChange}
                />
              </div>

              {appMode === 'diamond' ? (
                <div className="annotation-note path-note">
                  <PathEditor
                    path={pattern.path}
                    pathText={currentPathText}
                    selectedCellId={selectedCellId}
                    selectedCellValue={selectedCellValue}
                    onPathCellClick={handlePathCellClick}
                    onCellValueChange={handleCellValueChange}
                    onUndoPathStep={handleUndoPathStep}
                    onClearPath={handleClearPath}
                  />
                </div>
              ) : (
                <div className="annotation-note path-note">
                  <FreeMapEditor
                    view="controls"
                    pattern={freeMapPattern}
                    tool={freeMapTool}
                    activeCellId={playbackState.activeCellId}
                    message={freeMapMessage}
                    onToolChange={setFreeMapTool}
                    onRouteChange={handleFreeMapRouteChange}
                    onSelectCell={handleFreeMapSelectCell}
                    onActivateCell={handleFreeMapActivateCell}
                    onRemoveSelectedCell={handleFreeMapRemoveSelectedCell}
                    onClearMap={handleFreeMapClearMap}
                    onCellValueChange={handleFreeMapCellValueChange}
                    onAppendPathCell={handleFreeMapAppendPathCell}
                    onUndoPathStep={handleFreeMapUndoPathStep}
                    onClearPath={handleFreeMapClearPath}
                  />
                </div>
              )}
            </aside>

            <section className="diamond-stage" aria-label="Rhythm diamond">
              <div className="diamond-layout">
                <div className="diamond-core">
                  {appMode === 'diamond' ? (
                    <div
                      className="diamond-pulse-shell"
                      data-pulse-phase={beatPulse.id % 2}
                      data-stomp-pulse={beatPulse.isStomp}
                    >
                      <DiamondGrid
                        cells={pattern.cells}
                        path={pattern.path}
                        activeCellId={isValidCellId(playbackState.activeCellId) ? playbackState.activeCellId : null}
                        selectedCellId={selectedCellId}
                        onCellClick={handleCellClick}
                      />
                    </div>
                  ) : (
                    <FreeMapEditor
                      view="field"
                      pattern={freeMapPattern}
                      tool={freeMapTool}
                      activeCellId={playbackState.activeCellId}
                      message={freeMapMessage}
                      onToolChange={setFreeMapTool}
                      onRouteChange={handleFreeMapRouteChange}
                      onSelectCell={handleFreeMapSelectCell}
                      onActivateCell={handleFreeMapActivateCell}
                      onRemoveSelectedCell={handleFreeMapRemoveSelectedCell}
                      onClearMap={handleFreeMapClearMap}
                      onCellValueChange={handleFreeMapCellValueChange}
                      onAppendPathCell={handleFreeMapAppendPathCell}
                      onUndoPathStep={handleFreeMapUndoPathStep}
                      onClearPath={handleFreeMapClearPath}
                    />
                  )}
                  <CycleLengthPanel pattern={playablePattern} />
                  <RhythmLanes
                    pattern={playablePattern}
                    settings={settings}
                    playbackState={playbackState}
                    activeCellValue={activeCellValue}
                    beatPulseId={beatPulse.id}
                    isStompPulse={beatPulse.isStomp}
                  />
                </div>
              </div>
            </section>

            <aside className="right-column" aria-label="Sound and diamond tools">
              <section className="panel sound-panel" aria-label="Sound controls">
                <SoundControls
                  settings={settings}
                  soundMode={selectedSoundMode}
                  soundModeStatus={soundModeStatus}
                  onSoundModeChange={handleSoundModeChange}
                  onToggle={handleSoundToggle}
                  onVolumeChange={handleSoundVolumeChange}
                />
              </section>

              <section className="panel diamond-tools-card" aria-label="Diamond tools">
                <h2>Diamond tools</h2>
                <dl>
                  <div>
                    <dt>Current</dt>
                    <dd>{selectedPair?.name ?? pattern.name}</dd>
                  </div>
                  <div>
                    <dt>Cycle</dt>
                    <dd>{cycleLength} beats</dd>
                  </div>
                </dl>
                <div className="button-row wrap diamond-tools-actions">
                  <button
                    type="button"
                    className="diamond-action"
                    onClick={() => setDiamondToolsOpen(true)}
                    ref={openDiamondToolsButtonRef}
                  >
                    Open library &amp; solver
                  </button>
                  <button type="button" className="diamond-action random-action" onClick={handleRandomDiamond}>
                    Random diamond
                  </button>
                  <button
                    type="button"
                    className="diamond-action cut-action"
                    onClick={() => setCutCellsOpen(true)}
                    ref={openCutCellsButtonRef}
                  >
                    Cut cells
                  </button>
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>

      {diamondToolsOpen && (
        <DiamondToolsModal returnFocusRef={openDiamondToolsButtonRef} onClose={() => setDiamondToolsOpen(false)}>
          <DiamondLibraryControls
            selectedPairId={selectedPairId}
            onPairLoad={loadDiamondPair}
          />
        </DiamondToolsModal>
      )}

      {cutCellsOpen && (
        <DiamondToolsModal
          title="Cut cells"
          returnFocusRef={openCutCellsButtonRef}
          onClose={() => setCutCellsOpen(false)}
        >
          <CutCellsModal
            cells={cutEditableCells}
            mode={appMode}
            onCutChange={handleCutCellChange}
            onClearCuts={handleClearCuts}
          />
        </DiamondToolsModal>
      )}
    </>
  )
}
