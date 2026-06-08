import { diamondPairsUpToFifteen } from '../lib/rhythm/diamondLibrary'

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
  return (
    <section className="control-group" aria-label="Diamond library controls">
      <h2>Diamond library</h2>
      <label className="field">
        <span>Number pair</span>
        <select value={selectedPairId} onChange={(event) => onPairChange(event.target.value)}>
          {diamondPairsUpToFifteen.map((pair) => (
            <option key={pair.id} value={pair.id}>
              {pair.name}
            </option>
          ))}
        </select>
      </label>
      <div className="button-row wrap">
        <button type="button" onClick={onLoadDiamond}>
          Load diamond
        </button>
        <button type="button" onClick={onLoadInverse}>
          Load inverse
        </button>
        <button type="button" onClick={onRandomDiamond}>
          Random diamond
        </button>
      </div>
    </section>
  )
}
