import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { getCycleLength } from '../lib/rhythm/cycleLength'
import type { DiamondPattern, PlaybackState, RhythmSettings } from '../lib/rhythm/types'

const MAX_LANE_MARKERS = 64
const MAX_VALUE_LANES = 4
const valueLaneColors = ['#c07a2c', '#8c6f3f', '#b45d54', '#5f7a76']

type RhythmLanesProps = {
  pattern: DiamondPattern
  settings: RhythmSettings
  playbackState: PlaybackState
  activeCellValue: number | null
  beatPulseId: number
  isStompPulse: boolean
}

type LaneDefinition = {
  key: string
  label: string
  length: number
  position: number
  markerCount: number
  color: string
  kind: 'stomp' | 'value' | 'cycle'
  isActive: boolean
  isPulsing?: boolean
}

function positiveModulo(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo
}

function getPathValueCounts(pattern: DiamondPattern) {
  const valueCounts = new Map<number, number>()

  pattern.path.forEach((cellId) => {
    const value = pattern.cells[cellId]
    valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1)
  })

  return valueCounts
}

function getVisibleValueLanes(pattern: DiamondPattern, activeCellValue: number | null) {
  const valueCounts = getPathValueCounts(pattern)
  const allValues = Array.from(valueCounts.keys()).sort((left, right) => left - right)

  if (allValues.length <= MAX_VALUE_LANES) {
    return allValues
  }

  const selectedValues = new Set<number>()

  if (activeCellValue !== null && valueCounts.has(activeCellValue)) {
    selectedValues.add(activeCellValue)
  }

  Array.from(valueCounts.entries())
    .sort(([leftValue, leftCount], [rightValue, rightCount]) => {
      if (rightCount !== leftCount) {
        return rightCount - leftCount
      }

      return leftValue - rightValue
    })
    .forEach(([value]) => {
      if (selectedValues.size < MAX_VALUE_LANES) {
        selectedValues.add(value)
      }
    })

  return Array.from(selectedValues).sort((left, right) => left - right)
}

function getMarkerPercent(position: number, length: number) {
  return (positiveModulo(position, Math.max(1, length)) / Math.max(1, length)) * 100
}

function getMarkers(lane: LaneDefinition) {
  const markerCount = Math.min(Math.max(1, lane.markerCount), MAX_LANE_MARKERS)

  return Array.from({ length: markerCount }, (_, index) => {
    const percent = markerCount <= 1 ? 0 : (index / (markerCount - 1)) * 100

    return (
      <span
        className="rhythm-lane-marker"
        key={index}
        style={{ '--marker-position': `${percent}%` } as CSSProperties}
        aria-hidden="true"
      />
    )
  })
}

export function RhythmLanes({
  pattern,
  settings,
  playbackState,
  activeCellValue,
  beatPulseId,
  isStompPulse,
}: RhythmLanesProps) {
  const laneRefs = useRef(new Map<string, HTMLDivElement>())
  const cycleLength = Math.max(1, getCycleLength(pattern))
  const cyclePosition = positiveModulo(playbackState.globalTick, cycleLength)
  const stompPosition = positiveModulo(playbackState.globalTick, settings.stompInterval)
  const cellValue = Math.max(1, activeCellValue ?? 1)
  const cellPosition = positiveModulo(playbackState.ticksInsideCurrentCell, cellValue)
  const visibleValues = getVisibleValueLanes(pattern, activeCellValue)

  const lanes = useMemo(() => {
    const valueLanes: LaneDefinition[] = visibleValues.map((value, index) => {
      const isActive = activeCellValue === value

      return {
        key: `value-${value}`,
        label: `${value}-beat`,
        length: value,
        position: isActive ? cellPosition : 0,
        markerCount: value,
        color: valueLaneColors[index % valueLaneColors.length],
        kind: 'value',
        isActive,
      }
    })

    return [
      {
        key: 'stomp',
        label: 'Stomp',
        length: settings.stompInterval,
        position: stompPosition,
        markerCount: settings.stompInterval,
        color: 'var(--rd-stomp)',
        kind: 'stomp',
        isActive: true,
        isPulsing: stompPosition === 0,
      },
      ...valueLanes,
      {
        key: 'cycle',
        label: 'Cycle',
        length: cycleLength,
        position: cyclePosition,
        markerCount: cycleLength,
        color: 'var(--rd-accent)',
        kind: 'cycle',
        isActive: true,
      },
    ] satisfies LaneDefinition[]
  }, [
    activeCellValue,
    cellPosition,
    cycleLength,
    cyclePosition,
    settings.stompInterval,
    stompPosition,
    visibleValues,
  ])

  useEffect(() => {
    const beatStartMs = performance.now()
    const beatDurationMs = (60 / settings.bpm) * 1000
    let animationFrameId = 0

    function getProgress(lane: LaneDefinition, fractionalBeatProgress: number) {
      if (lane.kind === 'value' && !lane.isActive) {
        return 0
      }

      const progress = (positiveModulo(lane.position, lane.length) + fractionalBeatProgress) / lane.length

      return Math.max(0, Math.min(0.999, progress))
    }

    function updateLanePositions() {
      const elapsedMs = performance.now() - beatStartMs
      const fractionalBeatProgress = playbackState.isPlaying
        ? Math.max(0, Math.min(0.999, elapsedMs / beatDurationMs))
        : 0

      lanes.forEach((lane) => {
        const laneElement = laneRefs.current.get(lane.key)

        if (laneElement === undefined) {
          return
        }

        laneElement.style.setProperty(
          '--lane-progress',
          `${getProgress(lane, fractionalBeatProgress) * 100}%`,
        )
      })

      if (playbackState.isPlaying) {
        animationFrameId = window.requestAnimationFrame(updateLanePositions)
      }
    }

    updateLanePositions()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [
    lanes,
    playbackState.globalTick,
    playbackState.isPlaying,
    playbackState.ticksInsideCurrentCell,
    settings.bpm,
  ])

  return (
    <section
      className="rhythm-lanes-panel beat-pulse-surface"
      data-pulse-phase={beatPulseId % 2}
      data-stomp-pulse={isStompPulse}
      aria-label="Rhythm lane display"
    >
      <div className="rhythm-lanes" aria-hidden="true">
        {lanes.map((lane) => {
          return (
            <div
              className="rhythm-lane"
              data-lane-kind={lane.kind}
              data-active={lane.isActive}
              key={lane.key}
              ref={(node) => {
                if (node === null) {
                  laneRefs.current.delete(lane.key)
                } else {
                  laneRefs.current.set(lane.key, node)
                }
              }}
              style={
                {
                  '--lane-color': lane.color,
                  '--lane-progress': `${getMarkerPercent(lane.position, lane.length)}%`,
                } as CSSProperties
              }
            >
              <span className="rhythm-lane-label">{lane.label}</span>
              <span className="rhythm-lane-track">
                <span className="rhythm-lane-fill" />
                {getMarkers(lane)}
                {(lane.kind !== 'value' || lane.isActive) && (
                  <span className="rhythm-lane-playhead" data-pulse={lane.isPulsing} />
                )}
              </span>
            </div>
          )
        })}
      </div>

      <ul className="rhythm-lane-key" aria-label="Rhythm lane colour key">
        {lanes.map((lane) => (
          <li key={lane.key}>
            <span
              className="key-swatch"
              style={{ '--lane-color': lane.color } as CSSProperties}
              aria-hidden="true"
            />
            {lane.label}
          </li>
        ))}
      </ul>

      <p className="visually-hidden" aria-live="polite">
        Stomp beat {stompPosition + 1} of {settings.stompInterval}. Current{' '}
        {cellValue}-beat cell, beat {cellPosition + 1} of {cellValue}. Cycle beat{' '}
        {cyclePosition + 1} of {cycleLength}.
      </p>
    </section>
  )
}
