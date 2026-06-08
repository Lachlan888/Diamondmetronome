type SubdivisionIndicatorProps = {
  globalTick: number
  stompInterval: number
  stompActive: boolean
}

export function SubdivisionIndicator({
  globalTick,
  stompInterval,
  stompActive,
}: SubdivisionIndicatorProps) {
  const activeSubdivision = globalTick % stompInterval
  const dots = Array.from({ length: stompInterval }, (_, index) => index)

  return (
    <section className="control-group subdivision-box" aria-label="Beat grouping indicator">
      <h2>Stomp every</h2>
      <div className="subdivision-dots" aria-label={`Beat ${activeSubdivision + 1} of ${stompInterval} before the next stomp`}>
        {dots.map((dot) => (
          <span
            key={dot}
            className="subdivision-dot"
            data-active={dot === activeSubdivision}
            data-stomp={stompActive && dot === activeSubdivision}
            aria-hidden="true"
          />
        ))}
      </div>
      <p>
        {activeSubdivision + 1} / {stompInterval}
      </p>
    </section>
  )
}
