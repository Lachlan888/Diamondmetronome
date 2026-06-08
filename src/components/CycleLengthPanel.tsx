import {
  COMMON_CYCLE_GROUP_LENGTHS,
  getCycleLength,
  getEvenGroupings,
} from '../lib/rhythm/cycleLength'
import type { DiamondPattern } from '../lib/rhythm/types'

type CycleLengthPanelProps = {
  pattern: DiamondPattern
}

export function CycleLengthPanel({ pattern }: CycleLengthPanelProps) {
  const cycleLength = getCycleLength(pattern)
  const evenGroupings = getEvenGroupings(cycleLength)
  const commonGroupings = getEvenGroupings(cycleLength, COMMON_CYCLE_GROUP_LENGTHS)

  return (
    <aside className="cycle-panel" aria-label="Cycle length">
      <h2>Cycle length</h2>

      {pattern.path.length === 0 ? (
        <p className="message">No active path.</p>
      ) : (
        <>
          <p className="cycle-total">
            <strong>{cycleLength}</strong>
            <span>beats</span>
          </p>

          <div className="cycle-section">
            <h3>Fits evenly into bars of:</h3>
            {commonGroupings.length > 0 ? (
              <ul className="cycle-list">
                {commonGroupings.map(({ groupLength, groups }) => (
                  <li key={groupLength}>
                    {groupLength} beats x {groups}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="message">No common even fit.</p>
            )}
          </div>

          <div className="cycle-section">
            <h3>Even groupings:</h3>
            {evenGroupings.length > 0 ? (
              <ul className="cycle-list">
                {evenGroupings.map(({ groupLength, groups }) => (
                  <li key={groupLength}>
                    {groupLength} beats x {groups}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="message">No beat groups from 2 to 16 divide this cycle.</p>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
