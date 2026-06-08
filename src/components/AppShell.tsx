import { useEffect, useMemo, useRef, useState } from 'react'
import { DiamondGrid } from './DiamondGrid'
import { DiamondLibraryControls } from './DiamondLibraryControls'
import { DebugPanel } from './DebugPanel'
import { CycleLengthPanel } from './CycleLengthPanel'
import { PathEditor } from './PathEditor'
import { PatternControls } from './PatternControls'
import { SoundControls } from './SoundControls'
import { SubdivisionIndicator } from './SubdivisionIndicator'
import { TimingControls } from './TimingControls'
import { TransportControls } from './TransportControls'
import { createInitialPlaybackState, getCurrentCellValue, getTickEvents } from '../lib/rhythm/engine'
import { createRhythmScheduler, type RhythmScheduler, type ScheduledTick } from '../lib/audio/scheduler'
import { createTestToneEngine, type TestToneEngine } from '../lib/audio/testToneEngine'
import {
  createPatternFromDiamondPair,
  diamondPairsUpToFifteen,
  getDiamondPairById,
  getInverseDiamondPair,
} from '../lib/rhythm/diamondLibrary'
import { defaultPattern, defaultSettings } from '../lib/rhythm/patterns'
import { defaultRandomDiamondOptions, generateRandomDiamond } from '../lib/rhythm/randomDiamond'
import type { CellId, DiamondPattern, PlaybackState, RhythmSettings, SoundLayer, TickEvents } from '../lib/rhythm/types'
import { clampBpm, clampCellValue, isValidPath } from '../lib/rhythm/validation'
import { clearSavedPattern, hasSavedPattern, loadSavedPattern, savePattern } from '../lib/storage/localPatterns'

const EMPTY_PATH_MESSAGE = 'Add at least one cell to the path.'
const AUDIO_PLACEHOLDER_MESSAGE =
  'Temporary oscillator test sounds are active. Replace with body-percussion sample loading in the Web Audio scheduling pass.'

function restartForPattern(pattern: DiamondPattern): PlaybackState {
  return createInitialPlaybackState(pattern)
}

export function AppShell() {
  const testToneEngineRef = useRef<TestToneEngine | null>(null)
  const schedulerRef = useRef<RhythmScheduler | null>(null)
  const visualTimeoutIdsRef = useRef<number[]>([])
  const [pattern, setPattern] = useState<DiamondPattern>(defaultPattern)
  const [settings, setSettings] = useState<RhythmSettings>(defaultSettings)
  const [selectedCellId, setSelectedCellId] = useState<CellId>('centre')
  const [selectedPairId, setSelectedPairId] = useState<string>(diamondPairsUpToFifteen[0]?.id ?? '')
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() =>
    createInitialPlaybackState(defaultPattern),
  )
  const [lastTickEvents, setLastTickEvents] = useState<TickEvents>(() =>
    getTickEvents(defaultPattern, defaultSettings, createInitialPlaybackState(defaultPattern)),
  )
  const [patternMessage, setPatternMessage] = useState<string>('One local pattern can be saved.')

  const activeCellValue = getCurrentCellValue(pattern, playbackState)
  const pathIsValid = isValidPath(pattern.path)
  const selectedCellValue = pattern.cells[selectedCellId]

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
      setLastTickEvents(tickEvents)
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
    return () => {
      schedulerRef.current?.stop()
      clearPendingVisualTimeouts()
    }
  }, [])

  function stopPlayback() {
    const stoppedState = schedulerRef.current?.stop()
    clearPendingVisualTimeouts()

    setPlaybackState((currentState) => ({
      ...(stoppedState ?? currentState),
      isPlaying: false,
    }))
  }

  function resetPlayback(nextPattern = pattern) {
    const initialState = schedulerRef.current?.reset(nextPattern) ?? restartForPattern(nextPattern)
    clearPendingVisualTimeouts()
    setPlaybackState(initialState)
    setLastTickEvents(getTickEvents(nextPattern, settings, initialState))
  }

  async function handlePlay() {
    if (!pathIsValid) {
      stopPlayback()
      return
    }

    try {
      if (testToneEngineRef.current === null) {
        testToneEngineRef.current = createTestToneEngine()
      }

      await testToneEngineRef.current.resume()

      if (schedulerRef.current === null) {
        schedulerRef.current = createRhythmScheduler({
          toneEngine: testToneEngineRef.current,
          pattern,
          settings,
          onTickScheduled: scheduleVisualUpdate,
        })
      } else {
        schedulerRef.current.updateSettings(settings)
        schedulerRef.current.updatePattern(pattern)
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
      activeCellId: currentState.activeCellId ?? pattern.path[0] ?? null,
    }))
  }

  function handleStop() {
    stopPlayback()
  }

  function handleReset() {
    resetPlayback()
  }

  function updatePattern(nextPattern: DiamondPattern) {
    const scheduler = schedulerRef.current
    const nextPlaybackState =
      scheduler === null
        ? restartForPattern(nextPattern)
        : scheduler.isRunning()
          ? scheduler.updatePattern(nextPattern)
          : scheduler.reset(nextPattern)
    clearPendingVisualTimeouts()
    setPattern(nextPattern)
    setPlaybackState(nextPlaybackState)
    setLastTickEvents(getTickEvents(nextPattern, settings, nextPlaybackState))
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

  function applyPattern(nextPattern: DiamondPattern, message: string) {
    updatePattern(nextPattern)
    setSelectedCellId(nextPattern.path[0] ?? 'centre')
    setPatternMessage(message)
  }

  function handleSaveCurrent() {
    if (!isValidPath(pattern.path)) {
      setPatternMessage(EMPTY_PATH_MESSAGE)
      return
    }

    savePattern(pattern)
    setPatternMessage('Pattern saved locally.')
  }

  function handleLoadSaved() {
    if (!hasSavedPattern()) {
      setPatternMessage('No saved pattern found.')
      return
    }

    const savedPattern = loadSavedPattern()

    if (savedPattern === null) {
      clearSavedPattern()
      setSettings(defaultSettings)
      applyPattern(defaultPattern, 'Saved pattern was invalid, so the default pattern was kept.')
      return
    }

    applyPattern(savedPattern, 'Saved pattern loaded.')
  }

  function handleResetDefault() {
    setSettings(defaultSettings)
    applyPattern(defaultPattern, 'Default pattern restored.')
  }

  function handleLoadDiamond() {
    const selectedPair = getDiamondPairById(selectedPairId)

    if (selectedPair === null) {
      setPatternMessage('Selected diamond pair was not found.')
      return
    }

    const nextPattern = createPatternFromDiamondPair(selectedPair)
    applyPattern(nextPattern, `Loaded ${selectedPair.name}.`)
  }

  function handleLoadInverse() {
    const inversePair = getInverseDiamondPair(selectedPairId)

    if (inversePair === null) {
      setPatternMessage('Selected diamond inverse was not found.')
      return
    }

    setSelectedPairId(inversePair.id)
    const nextPattern = createPatternFromDiamondPair(inversePair)
    applyPattern(nextPattern, `Loaded inverse: ${inversePair.name}.`)
  }

  function handleRandomDiamond() {
    const randomPattern = generateRandomDiamond(defaultRandomDiamondOptions)
    applyPattern(randomPattern, `Generated ${randomPattern.name}.`)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Diamond Metronome</h1>
      </header>

      <section className="practice-area" aria-label="Diamond Metronome workspace">
        <aside className="annotation-panel transport-stack" aria-label="Playback and timing controls">
          <div className="annotation-note">
            <TransportControls
              isPlaying={playbackState.isPlaying}
              pathIsValid={pathIsValid}
              onPlay={handlePlay}
              onStop={handleStop}
              onReset={handleReset}
            />
          </div>

          {!pathIsValid && <p className="message warning">{EMPTY_PATH_MESSAGE}</p>}

          <div className="annotation-note">
            <TimingControls
              bpm={settings.bpm}
              stompInterval={settings.stompInterval}
              onBpmChange={handleBpmChange}
              onStompIntervalChange={handleStompIntervalChange}
            />
          </div>

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
        </aside>

        <section className="diamond-stage" aria-label="Rhythm diamond">
          <div className="diamond-layout">
            <div className="diamond-core">
              <div className="diamond-caption">
                <p>{pattern.name}</p>
              </div>
              <DiamondGrid
                cells={pattern.cells}
                path={pattern.path}
                activeCellId={playbackState.activeCellId}
                selectedCellId={selectedCellId}
                onCellClick={handleCellClick}
              />
              <div className="pulse-status">
                <p className="active-cell-text" aria-live="polite">
                  Active cell: {playbackState.activeCellId ?? 'none'}
                  {activeCellValue !== null ? `, value ${activeCellValue}` : ''}
                </p>
                <SubdivisionIndicator
                  globalTick={playbackState.globalTick}
                  stompInterval={settings.stompInterval}
                  stompActive={lastTickEvents.stomp}
                />
              </div>
            </div>

            <CycleLengthPanel pattern={pattern} />
          </div>
        </section>
      </section>

      <section className="support-area" aria-label="Editing and sound controls">
        <div className="panel pattern-panel" aria-label="Pattern library and saving">
          <PatternControls
            message={patternMessage}
            onSave={handleSaveCurrent}
            onLoad={handleLoadSaved}
            onResetDefault={handleResetDefault}
          />

          <DiamondLibraryControls
            selectedPairId={selectedPairId}
            onPairChange={setSelectedPairId}
            onLoadDiamond={handleLoadDiamond}
            onLoadInverse={handleLoadInverse}
            onRandomDiamond={handleRandomDiamond}
          />
        </div>

        <div className="panel sound-panel" aria-label="Sound controls">
          <SoundControls
            settings={settings}
            onToggle={handleSoundToggle}
            onVolumeChange={handleSoundVolumeChange}
          />
          <div className="audio-note">
            <h2>Audio</h2>
            <p>{AUDIO_PLACEHOLDER_MESSAGE}</p>
          </div>
        </div>
      </section>

      <section className="debug-area" aria-label="Development diagnostics">
        <DebugPanel
          isPlaying={playbackState.isPlaying}
          activeCellValue={activeCellValue}
          tickEvents={lastTickEvents}
        />
      </section>
    </main>
  )
}
