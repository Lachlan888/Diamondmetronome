import { ALLOWED_STOMP_INTERVALS, BPM_MAX, BPM_MIN } from '../lib/rhythm/constants'

type TimingControlsProps = {
  bpm: number
  stompInterval: number
  onBpmChange: (bpm: number) => void
  onStompIntervalChange: (stompInterval: number) => void
}

export function TimingControls({
  bpm,
  stompInterval,
  onBpmChange,
  onStompIntervalChange,
}: TimingControlsProps) {
  return (
    <section className="control-group" aria-label="Timing controls">
      <h2>Timing</h2>
      <label className="field">
        <span>BPM</span>
        <span className="field-help">Beat rate</span>
        <div className="bpm-control">
          <input
            type="number"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
            aria-label="BPM beat rate"
          />
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
            aria-label="BPM slider"
          />
        </div>
      </label>

      <fieldset className="segmented stomp-pad">
        <legend>Stomp every</legend>
        <p className="field-help">Beats between stomps</p>
        <div className="segmented-options">
          {ALLOWED_STOMP_INTERVALS.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name="stomp-interval"
                value={option}
                checked={stompInterval === option}
                onChange={() => onStompIntervalChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="message">BPM controls the counted beat. Stomp every groups those beats into a body pulse.</p>
    </section>
  )
}
