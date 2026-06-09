type PatternControlsProps = {
  message: string
  onGlobalReset: () => void
}

export function PatternControls({ message, onGlobalReset }: PatternControlsProps) {
  return (
    <section className="control-group" aria-label="Pattern controls">
      <h2>Workshop</h2>
      <div className="button-row wrap">
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
