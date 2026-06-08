type TransportControlsProps = {
  isPlaying: boolean
  pathIsValid: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export function TransportControls({
  isPlaying,
  pathIsValid,
  onPlay,
  onPause,
  onStop,
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
          className="transport-button pause-button"
          onClick={onPause}
          disabled={!isPlaying}
          aria-label="Pause"
          title="Pause"
        >
          <span aria-hidden="true">Ⅱ</span>
        </button>
        <button
          type="button"
          className="transport-button stop-button"
          onClick={onStop}
          aria-label="Stop and return to start"
          title="Stop"
        >
          <span aria-hidden="true">■</span>
        </button>
      </div>
    </section>
  )
}
