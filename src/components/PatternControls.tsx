type PatternControlsProps = {
  message: string
  onSave: () => void
  onLoad: () => void
  onGlobalReset: () => void
}

export function PatternControls({ message, onSave, onLoad, onGlobalReset }: PatternControlsProps) {
  return (
    <section className="control-group" aria-label="Pattern controls">
      <h2>Pattern</h2>
      <div className="button-row wrap">
        <button type="button" onClick={onSave}>
          Save current
        </button>
        <button type="button" onClick={onLoad}>
          Load saved
        </button>
        <button type="button" onClick={onGlobalReset}>
          Global reset
        </button>
      </div>
      <p className="message" aria-live="polite">
        {message}
      </p>
    </section>
  )
}
