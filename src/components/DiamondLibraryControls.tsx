import { Fragment, useMemo, useState, type CSSProperties } from 'react'
import {
  diamondDivisibilityByPairId,
  SUPPORTED_DIVISIBILITY_DIVISORS,
  type DiamondDivisibility,
} from '../lib/rhythm/diamondCompatibility'
import { DIAMOND_PAIR_MAX, getDiamondPairById } from '../lib/rhythm/diamondLibrary'
import { solveDiamond, type DiamondSolverField, type DiamondSolverRecommendation } from '../lib/rhythm/diamondSolver'

type DiamondLibraryControlsProps = {
  selectedPairId: string
  onPairLoad: (numerator: number, denominator: number) => void
}

type SolverInputs = {
  beatsPerBar: string
  denominator: string
  bars: string
  targetBeats: string
}

const initialSolverInputs: SolverInputs = {
  beatsPerBar: '4',
  denominator: '4',
  bars: '',
  targetBeats: '',
}

function parsePositiveWholeNumber(value: string): number | null {
  const parsedValue = Number(value)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function getFieldValue(inputValue: string, field: DiamondSolverField): string {
  return inputValue === '' && field.calculated && field.value !== null ? String(field.value) : inputValue
}

function getBeatDifferenceText(beatDifference: number) {
  if (beatDifference < 0) {
    return `shorter by ${Math.abs(beatDifference)} beats`
  }

  if (beatDifference > 0) {
    return `longer by ${beatDifference} beats`
  }

  return 'exact match'
}

function getBarFitText(cycleLength: number, beatsPerBar: number | null, denominator: string) {
  if (beatsPerBar === null) {
    return null
  }

  const bars = cycleLength / beatsPerBar
  const formattedBars = Number.isInteger(bars) ? String(bars) : bars.toFixed(2)

  return `${formattedBars} bars of ${beatsPerBar}/${denominator || '4'}`
}

function getSelectedDifferenceText(beatDifference: number | null) {
  if (beatDifference === null) {
    return null
  }

  if (beatDifference === 0) {
    return null
  }

  if (beatDifference > 0) {
    return `Selected diamond is ${beatDifference} beats longer.`
  }

  return `Selected diamond is ${Math.abs(beatDifference)} beats shorter.`
}

function formatDivisors(divisibility: DiamondDivisibility | undefined): string {
  if (!divisibility || divisibility.divisors.length === 0) {
    return 'none of the supported bar lengths'
  }

  if (divisibility.divisors.length === 1) {
    return String(divisibility.divisors[0])
  }

  return `${divisibility.divisors.slice(0, -1).join(', ')} and ${divisibility.divisors.at(-1)}`
}

function getDivisibilityStyle(divisibility: DiamondDivisibility | undefined): CSSProperties | undefined {
  if (!divisibility || divisibility.divisors.length === 0) {
    return undefined
  }

  if (divisibility.divisors.length === 1) {
    return {
      '--diamond-compatibility-bg': `var(--division-${divisibility.divisors[0]})`,
    } as CSSProperties
  }

  const segmentWidth = 100 / divisibility.divisors.length
  const segments = divisibility.divisors.flatMap((divisor, index) => {
    const start = (segmentWidth * index).toFixed(3)
    const end = (segmentWidth * (index + 1)).toFixed(3)

    return [`var(--division-${divisor}) ${start}%`, `var(--division-${divisor}) ${end}%`]
  })

  return {
    '--diamond-compatibility-bg': `linear-gradient(90deg, ${segments.join(', ')})`,
  } as CSSProperties
}

export function DiamondLibraryControls({
  selectedPairId,
  onPairLoad,
}: DiamondLibraryControlsProps) {
  const [solverInputs, setSolverInputs] = useState<SolverInputs>(initialSolverInputs)
  const selectedPair = getDiamondPairById(selectedPairId)
  const pairValues = Array.from({ length: DIAMOND_PAIR_MAX }, (_, index) => index + 1)
  const beatsPerBar = parsePositiveWholeNumber(solverInputs.beatsPerBar)
  const solverResult = useMemo(
    () =>
      solveDiamond({
        beatsPerBar,
        bars: parsePositiveWholeNumber(solverInputs.bars),
        targetBeats: parsePositiveWholeNumber(solverInputs.targetBeats),
        selectedPair,
      }),
    [beatsPerBar, selectedPair, solverInputs.bars, solverInputs.targetBeats],
  )
  const visibleRecommendations =
    solverResult.exactRecommendations.length > 0
      ? solverResult.exactRecommendations
      : solverResult.nearestRecommendations
  const hasApproximateRecommendations =
    solverResult.exactRecommendations.length === 0 && solverResult.nearestRecommendations.length > 0

  function updateSolverInput(field: keyof SolverInputs, value: string) {
    setSolverInputs((currentInputs) => ({
      ...currentInputs,
      [field]: value,
    }))
  }

  function handleRecommendationLoad(recommendation: DiamondSolverRecommendation) {
    onPairLoad(recommendation.pair.numerator, recommendation.pair.denominator)
  }

  return (
    <section className="control-group" aria-label="Diamond library controls">
      <div className="diamond-library-workspace">
        <div className="diamond-solver" aria-label="Diamond solver">
          <div className="diamond-solver-header">
            <h3>Diamond solver</h3>
          </div>

          <div className="solver-card solver-target-card">
            <h4>Target</h4>
            <div className="diamond-solver-fields">
              <label className="field compact-field">
                <span>Time</span>
                <div className="solver-time-signature">
                  <input
                    type="number"
                    min="1"
                    value={solverInputs.beatsPerBar}
                    onChange={(event) => updateSolverInput('beatsPerBar', event.target.value)}
                    aria-label="Beats per bar"
                  />
                  <span aria-hidden="true">/</span>
                  <input
                    type="number"
                    min="1"
                    value={solverInputs.denominator}
                    onChange={(event) => updateSolverInput('denominator', event.target.value)}
                    aria-label="Time signature denominator"
                  />
                </div>
              </label>

              <label className="field compact-field" data-calculated={solverResult.fields.bars.calculated}>
                <span>Bars</span>
                <input
                  type="number"
                  min="1"
                  value={getFieldValue(solverInputs.bars, solverResult.fields.bars)}
                  onChange={(event) => updateSolverInput('bars', event.target.value)}
                  aria-describedby={solverResult.fields.bars.calculated ? 'bars-calculated' : undefined}
                />
                {solverResult.fields.bars.calculated && <small id="bars-calculated">calculated</small>}
              </label>

              <label className="field compact-field" data-calculated={solverResult.fields.targetBeats.calculated}>
                <span>Target beats</span>
                <input
                  type="number"
                  min="1"
                  value={getFieldValue(solverInputs.targetBeats, solverResult.fields.targetBeats)}
                  onChange={(event) => updateSolverInput('targetBeats', event.target.value)}
                  aria-describedby={solverResult.fields.targetBeats.calculated ? 'target-beats-calculated' : undefined}
                />
                {solverResult.fields.targetBeats.calculated && <small id="target-beats-calculated">calculated</small>}
              </label>
            </div>
          </div>

          {selectedPair && solverResult.selectedCycleLength !== null && (
            <div
              className="solver-card solver-selected-cycle"
              data-mismatch={solverResult.selectedBeatDifference !== null && solverResult.selectedBeatDifference !== 0}
            >
              <h4>Selected</h4>
              <p>
                <strong>{selectedPair.name}</strong>
              </p>
              <p className="solver-selected-meta">
                <strong>{solverResult.selectedCycleLength} beats</strong>
                {solverResult.selectedBarFit !== null && (
                  <>
                    {' '}
                    ·{' '}
                    <strong>
                      {Number.isInteger(solverResult.selectedBarFit)
                        ? solverResult.selectedBarFit
                        : solverResult.selectedBarFit.toFixed(2)}
                    </strong>{' '}
                    bars of {beatsPerBar}/{solverInputs.denominator || '4'}
                  </>
                )}
              </p>
              {getSelectedDifferenceText(solverResult.selectedBeatDifference) && (
                <p>{getSelectedDifferenceText(solverResult.selectedBeatDifference)}</p>
              )}
            </div>
          )}

          <div className="solver-card diamond-solver-output" aria-live="polite">
            <h4>{hasApproximateRecommendations ? 'Nearest matches' : 'Exact matches'}</h4>
            {visibleRecommendations.length > 0 ? (
              <div className="solver-recommendations" aria-label="Diamond recommendations">
                {visibleRecommendations.map((recommendation) => {
                  const barFitText = getBarFitText(
                    recommendation.cycleLength,
                    beatsPerBar,
                    solverInputs.denominator,
                  )

                  return (
                    <button
                      type="button"
                      className="solver-recommendation"
                      data-approximate={hasApproximateRecommendations}
                      key={recommendation.pair.id}
                      onClick={() => handleRecommendationLoad(recommendation)}
                    >
                      <strong>{recommendation.pair.name}</strong>
                      <span>{recommendation.cycleLength} beats</span>
                      {barFitText && <span>{barFitText}</span>}
                      {hasApproximateRecommendations && <span>{getBeatDifferenceText(recommendation.beatDifference)}</span>}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="diamond-map-scroll">
          <div className="diamond-divisibility-legend" aria-label="Cycle divisibility colours">
            <span>Fits:</span>
            {SUPPORTED_DIVISIBILITY_DIVISORS.map((divisor) => (
              <span className="division-legend-item" key={divisor}>
                <span
                  aria-hidden="true"
                  className="division-legend-swatch"
                  style={{ '--division-swatch': `var(--division-${divisor})` } as CSSProperties}
                />
                {divisor}
              </span>
            ))}
          </div>

          <div className="diamond-map-frame">
            <div
              className="diamond-map"
              role="grid"
              aria-label={`Ordered number-pair diamond map, 1 to ${DIAMOND_PAIR_MAX}`}
            >
              {pairValues.map((numerator) => {
                return (
                  <Fragment key={`diamond-map-row-${numerator}`}>
                    {pairValues.map((denominator) => {
                      if (numerator === denominator) {
                        return (
                          <span
                            className="diamond-map-empty"
                            key={`${numerator}-${denominator}`}
                            role="gridcell"
                            aria-label={`${numerator}/${denominator} is not used`}
                          >
                            ·
                          </span>
                        )
                      }

                      const pairId = `pair-${numerator}-${denominator}`
                      const isSelected = pairId === selectedPairId
                      const isInverse = pairId === selectedPair?.inverseId
                      const divisibility = diamondDivisibilityByPairId.get(pairId)
                      const divisibilityLabel = formatDivisors(divisibility)

                      return (
                        <button
                          type="button"
                          className="diamond-map-pair"
                          data-selected={isSelected}
                          data-inverse={isInverse}
                          key={pairId}
                          onClick={() => onPairLoad(numerator, denominator)}
                          role="gridcell"
                          aria-label={`${numerator} over ${denominator} Diamond. Cycle length ${
                            divisibility?.cycleLength ?? 'unknown'
                          } beats. Divisible evenly by ${divisibilityLabel}.`}
                          aria-pressed={isSelected}
                          style={getDivisibilityStyle(divisibility)}
                          title={`${numerator}/${denominator} Diamond. Cycle length ${
                            divisibility?.cycleLength ?? 'unknown'
                          } beats. Divisible evenly by ${divisibilityLabel}.`}
                        >
                          <span>{numerator}/{denominator}</span>
                          {isInverse && <small aria-hidden="true">inv</small>}
                        </button>
                      )
                    })}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
