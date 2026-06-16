import {
  COMMON_CYCLE_GROUP_LENGTHS,
  getCycleLength,
  getEvenGroupings,
} from '../lib/rhythm/cycleLength'
import type { PlayablePattern } from '../lib/rhythm/types'

type CycleLengthPanelProps = {
  pattern: PlayablePattern
}

export function CycleLengthPanel({ pattern }: CycleLengthPanelProps) {
  const cycleLength = getCycleLength(pattern)
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
            <h3>Fits evenly into:</h3>
            {commonGroupings.length > 0 ? (
              <ul className="cycle-list">
                {commonGroupings.map(({ groupLength, groups }) => (
                  <li key={groupLength}>
                    {groupLength} × {groups}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="message">No common even fit.</p>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
