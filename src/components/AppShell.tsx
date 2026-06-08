import { useEffect, useMemo, useRef, useState } from 'react'
import { DiamondGrid } from './DiamondGrid'
import { DiamondLibraryControls } from './DiamondLibraryControls'
import { DebugPanel } from './DebugPanel'
import { CycleLengthPanel } from './CycleLengthPanel'
import { PathEditor } from './PathEditor'
import { PatternControls } from './PatternControls'
import { RhythmLanes } from './RhythmLanes'
import { SoundControls } from './SoundControls'
import { TimingControls } from './TimingControls'
import { TransportControls } from './TransportControls'
import { createInitialPlaybackState, getCurrentCellValue, getTickEvents } from '../lib/rhythm/engine'
import { createRhythmScheduler, type RhythmScheduler, type ScheduledTick } from '../lib/audio/scheduler'
import { createTestToneEngine, type TestToneEngine } from '../lib/audio/testToneEngine'
import {
  getSoundModeDefinition,
  loadSavedSoundMode,
  saveSoundMode,
  type SoundMode,
} from '../lib/audio/soundModes'
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
  'Cajon samples and oscillator tones are available. Body Percussion mode falls back until its sample pack is added.'

function restartForPattern(pattern: DiamondPattern): PlaybackState {
  return createInitialPlaybackState(pattern)
}

function getInitialSoundMode(): SoundMode {
  return loadSavedSoundMode() ?? 'cajon'
}

export function AppShell() {
  const testToneEngineRef = useRef<TestToneEngine | null>(null)
  const schedulerRef = useRef<RhythmScheduler | null>(null)
  const visualTimeoutIdsRef = useRef<number[]>([])
  const [pattern, setPattern] = useState<DiamondPattern>(defaultPattern)
  const [settings, setSettings] = useState<RhythmSettings>(defaultSettings)
  const [selectedSoundMode, setSelectedSoundMode] = useState<SoundMode>(() => getInitialSoundMode())
  const [soundModeStatus, setSoundModeStatus] = useState<string>(() => {
    const initialSoundMode = getInitialSoundMode()
    return `Sound mode: ${getSoundModeDefinition(initialSoundMode).name}`
  })
  const [selectedCellId, setSelectedCellId] = useState<CellId>('centre')
  const [selectedPairId, setSelectedPairId] = useState<string>(diamondPairsUpToFifteen[0]?.id ?? '')
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() =>
    createInitialPlaybackState(defaultPattern),
  )
  const [lastTickEvents, setLastTickEvents] = useState<TickEvents>(() =>
    getTickEvents(defaultPattern, defaultSettings, createInitialPlaybackState(defaultPattern)),
  )
  const [patternMessage, setPatternMessage] = useState<string>('One local pattern can be saved.')
  const [beatPulse, setBeatPulse] = useState({ id: 0, isStomp: false })

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
    saveSoundMode(selectedSoundMode)
    const toneEngine = testToneEngineRef.current

    if (toneEngine === null) {
      setSoundModeStatus(`Sound mode: ${getSoundModeDefinition(selectedSoundMode).name}`)
      return
    }

    let isCancelled = false

    toneEngine.setSoundMode(selectedSoundMode).then((status) => {
      if (!isCancelled) {
        setSoundModeStatus(status.message)
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

  function resetPlayback(nextPattern = pattern, nextSettings = settings) {
    const initialState = schedulerRef.current?.reset(nextPattern) ?? restartForPattern(nextPattern)
    clearPendingVisualTimeouts()
    setPlaybackState(initialState)
    setLastTickEvents(getTickEvents(nextPattern, nextSettings, initialState))
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
      setSoundModeStatus(nextSoundModeStatus.message)

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

  function handlePause() {
    pausePlayback()
  }

  function handleStop() {
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

  function handleSoundModeChange(nextSoundMode: SoundMode) {
    setSelectedSoundMode(nextSoundMode)
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

  function handleGlobalReset() {
    schedulerRef.current?.updateSettings(defaultSettings)
    setSettings(defaultSettings)
    setSelectedSoundMode('cajon')
    setPattern(defaultPattern)
    setSelectedCellId(defaultPattern.path[0] ?? 'centre')
    resetPlayback(defaultPattern, defaultSettings)
    setPatternMessage('App reset to defaults.')
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
              onPause={handlePause}
              onStop={handleStop}
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
              <div
                className="diamond-pulse-shell"
                data-pulse-phase={beatPulse.id % 2}
                data-stomp-pulse={beatPulse.isStomp}
              >
                <DiamondGrid
                  cells={pattern.cells}
                  path={pattern.path}
                  activeCellId={playbackState.activeCellId}
                  selectedCellId={selectedCellId}
                  onCellClick={handleCellClick}
                />
              </div>
              <CycleLengthPanel pattern={pattern} />
              <RhythmLanes
                pattern={pattern}
                settings={settings}
                playbackState={playbackState}
                activeCellValue={activeCellValue}
                beatPulseId={beatPulse.id}
                isStompPulse={beatPulse.isStomp}
              />
            </div>
          </div>
        </section>

        <aside className="panel sound-panel" aria-label="Sound controls">
          <SoundControls
            settings={settings}
            soundMode={selectedSoundMode}
            soundModeStatus={soundModeStatus}
            onSoundModeChange={handleSoundModeChange}
            onToggle={handleSoundToggle}
            onVolumeChange={handleSoundVolumeChange}
          />
          <div className="audio-note">
            <h2>Audio</h2>
            <p>{AUDIO_PLACEHOLDER_MESSAGE}</p>
          </div>
        </aside>
      </section>

      <section className="support-area" aria-label="Pattern library and saving">
        <div className="panel pattern-panel" aria-label="Pattern library and saving">
          <PatternControls
            message={patternMessage}
            onSave={handleSaveCurrent}
            onLoad={handleLoadSaved}
            onGlobalReset={handleGlobalReset}
          />

          <DiamondLibraryControls
            selectedPairId={selectedPairId}
            onPairChange={setSelectedPairId}
            onLoadDiamond={handleLoadDiamond}
            onLoadInverse={handleLoadInverse}
            onRandomDiamond={handleRandomDiamond}
          />
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
