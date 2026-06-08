import type { TickEvents } from '../lib/rhythm/types'

type DebugPanelProps = {
  tickEvents: TickEvents
  activeCellValue: number | null
  isPlaying: boolean
}

function yesNo(value: boolean) {
  return value ? 'yes' : 'no'
}

export function DebugPanel({ tickEvents, activeCellValue, isPlaying }: DebugPanelProps) {
  return (
    <details className="panel debug-panel">
      <summary>Debug panel</summary>
      <dl>
        <div>
          <dt>global tick</dt>
          <dd>{tickEvents.globalTick}</dd>
        </div>
        <div>
          <dt>current path index</dt>
          <dd>{tickEvents.currentPathIndex}</dd>
        </div>
        <div>
          <dt>active cell</dt>
          <dd>{tickEvents.activeCellId ?? 'none'}</dd>
        </div>
        <div>
          <dt>active cell value</dt>
          <dd>{activeCellValue ?? 'none'}</dd>
        </div>
        <div>
          <dt>ticks inside current cell</dt>
          <dd>{tickEvents.ticksInsideCurrentCell}</dd>
        </div>
        <div>
          <dt>stomp event</dt>
          <dd>{yesNo(tickEvents.stomp)}</dd>
        </div>
        <div>
          <dt>subdivision event</dt>
          <dd>{yesNo(tickEvents.subdivision)}</dd>
        </div>
        <div>
          <dt>accent event</dt>
          <dd>{yesNo(tickEvents.accent)}</dd>
        </div>
        <div>
          <dt>is playing</dt>
          <dd>{yesNo(isPlaying)}</dd>
        </div>
      </dl>
    </details>
  )
}
