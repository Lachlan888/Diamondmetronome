import { Fragment } from 'react'
import { getDiamondPairById, getInverseDiamondPair } from '../lib/rhythm/diamondLibrary'

type DiamondLibraryControlsProps = {
  selectedPairId: string
  onPairChange: (pairId: string) => void
  onLoadDiamond: () => void
  onLoadInverse: () => void
  onRandomDiamond: () => void
}

export function DiamondLibraryControls({
  selectedPairId,
  onPairChange,
  onLoadDiamond,
  onLoadInverse,
  onRandomDiamond,
}: DiamondLibraryControlsProps) {
  const selectedPair = getDiamondPairById(selectedPairId)
  const inversePair = getInverseDiamondPair(selectedPairId)

  return (
    <section className="control-group" aria-label="Diamond library controls">
      <h2>Diamond library</h2>
      <p className="field-help">Choose a number pair. The inverse is highlighted automatically.</p>

      <div className="diamond-map" role="grid" aria-label="Ordered number-pair diamond map">
        <span className="diamond-map-corner" aria-hidden="true" />
        {Array.from({ length: 9 }, (_, index) => (
          <span className="diamond-map-axis" key={`column-${index + 1}`} aria-hidden="true">
            {index + 1}
          </span>
        ))}

        {Array.from({ length: 9 }, (_, rowIndex) => {
          const numerator = rowIndex + 1

          return (
            <Fragment key={`diamond-map-row-${numerator}`}>
              <span className="diamond-map-axis" key={`row-${numerator}`} aria-hidden="true">
                {numerator}
              </span>
              {Array.from({ length: 9 }, (_, columnIndex) => {
                const denominator = columnIndex + 1

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

                return (
                  <button
                    type="button"
                    className="diamond-map-pair"
                    data-selected={isSelected}
                    data-inverse={isInverse}
                    key={pairId}
                    onClick={() => onPairChange(pairId)}
                    role="gridcell"
                    aria-label={`Select ${numerator} over ${denominator} diamond`}
                    aria-pressed={isSelected}
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

      <div className="diamond-map-summary">
        <p>
          <strong>Selected:</strong> {selectedPair?.name ?? 'None'}
        </p>
        <p>
          <strong>Inverse:</strong> {inversePair?.name ?? 'None'}
        </p>
      </div>

      <div className="button-row wrap diamond-map-actions">
        <button type="button" onClick={onLoadDiamond}>
          Load selected
        </button>
        <button type="button" onClick={onLoadInverse}>
          Load inverse
        </button>
      </div>

      <div className="diamond-map-random">
        <button type="button" onClick={onRandomDiamond}>
          Random diamond
        </button>
      </div>
    </section>
  )
}
