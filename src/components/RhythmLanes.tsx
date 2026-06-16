import { useMemo, type CSSProperties } from 'react'
import { getCellValue } from '../lib/rhythm/cells'
import { getCycleLength } from '../lib/rhythm/cycleLength'
import type { PlaybackState, PlayablePattern, RhythmSettings } from '../lib/rhythm/types'

const MAX_LANE_MARKERS = 64
const MAX_VALUE_LANES = 4
const valueLaneColors = ['#c07a2c', '#8c6f3f', '#b45d54', '#5f7a76']

type RhythmLanesProps = {
  pattern: PlayablePattern
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
  activeMarkerIndex: number | null
  color: string
  kind: 'stomp' | 'value' | 'cycle'
  isActive: boolean
  isPulsing?: boolean
}

function positiveModulo(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo
}

function getPathValueCounts(pattern: PlayablePattern) {
  const valueCounts = new Map<number, number>()

  pattern.path.forEach((cellId) => {
    const value = getCellValue(pattern.cells[cellId])
    if (value === null) {
      return
    }
    valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1)
  })

  return valueCounts
}

function getVisibleValueLanes(pattern: PlayablePattern, activeCellValue: number | null) {
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

function getActiveMarkerIndex(position: number, length: number, markerCount: number) {
  const safeLength = Math.max(1, length)
  const safeMarkerCount = Math.min(Math.max(1, markerCount), MAX_LANE_MARKERS)
  const normalizedPosition = positiveModulo(position, safeLength)

  return Math.min(safeMarkerCount - 1, Math.floor((normalizedPosition / safeLength) * safeMarkerCount))
}

function getMarkers(lane: LaneDefinition) {
  const markerCount = Math.min(Math.max(1, lane.markerCount), MAX_LANE_MARKERS)

  return Array.from({ length: markerCount }, (_, index) => (
    <span
      className="rhythm-lane-marker"
      data-active={lane.activeMarkerIndex === index}
      data-pulse={lane.isPulsing && lane.activeMarkerIndex === index}
      key={index}
      aria-hidden="true"
    />
  ))
}

export function RhythmLanes({
  pattern,
  settings,
  playbackState,
  activeCellValue,
  beatPulseId,
  isStompPulse,
}: RhythmLanesProps) {
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
        activeMarkerIndex: isActive ? getActiveMarkerIndex(cellPosition, value, value) : null,
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
        activeMarkerIndex: getActiveMarkerIndex(stompPosition, settings.stompInterval, settings.stompInterval),
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
        activeMarkerIndex: getActiveMarkerIndex(cyclePosition, cycleLength, cycleLength),
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
              style={
                {
                  '--lane-color': lane.color,
                } as CSSProperties
              }
            >
              <span className="rhythm-lane-label">{lane.label}</span>
              <span className="rhythm-lane-circles">{getMarkers(lane)}</span>
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
