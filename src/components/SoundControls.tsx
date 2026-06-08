import { SOUND_LAYERS } from '../lib/rhythm/constants'
import type { RhythmSettings, SoundLayer } from '../lib/rhythm/types'
import { clampVolume } from '../lib/rhythm/validation'

type SoundControlsProps = {
  settings: RhythmSettings
  onToggle: (layer: SoundLayer, enabled: boolean) => void
  onVolumeChange: (layer: SoundLayer, volume: number) => void
}

const layerLabels: Record<SoundLayer, string> = {
  stomp: 'Stomp',
  subdivision: 'Subdivision',
  accent: 'Accent',
}

export function SoundControls({ settings, onToggle, onVolumeChange }: SoundControlsProps) {
  return (
    <section className="control-group" aria-label="Sound controls">
      <h2>Sound layers</h2>
      <div className="sound-list">
        {SOUND_LAYERS.map((layer) => (
          <div className="sound-layer" key={layer}>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.soundToggles[layer]}
                onChange={(event) => onToggle(layer, event.target.checked)}
              />
              <span>{layerLabels[layer]}</span>
            </label>
            <label className="field compact-field">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.soundVolumes[layer]}
                onChange={(event) => onVolumeChange(layer, clampVolume(Number(event.target.value)))}
                aria-label={`${layerLabels[layer]} volume`}
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  )
}
