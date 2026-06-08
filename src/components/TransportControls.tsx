type TransportControlsProps = {
  isPlaying: boolean
  pathIsValid: boolean
  onPlay: () => void
  onStop: () => void
  onReset: () => void
}

export function TransportControls({
  isPlaying,
  pathIsValid,
  onPlay,
  onStop,
  onReset,
}: TransportControlsProps) {
  return (
    <section className="control-group" aria-label="Transport">
      <h2>Transport</h2>
      <div className="button-row transport-buttons">
        <button
          type="button"
          className="transport-button play-button"
          onClick={onPlay}
          disabled={isPlaying || !pathIsValid}
          aria-label="Play"
          title="Play"
        >
          <span aria-hidden="true">▶</span>
        </button>
        <button
          type="button"
          className="transport-button stop-button"
          onClick={onStop}
          disabled={!isPlaying}
          aria-label="Stop"
          title="Stop"
        >
          <span aria-hidden="true">■</span>
        </button>
        <button type="button" className="reset-button" onClick={onReset} aria-label="Reset">
          Reset
        </button>
      </div>
    </section>
  )
}
