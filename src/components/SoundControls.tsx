import { SOUND_LAYERS } from '../lib/rhythm/constants'
import type { RhythmSettings, SoundLayer } from '../lib/rhythm/types'
import { clampVolume } from '../lib/rhythm/validation'
import { soundModes, type SoundMode } from '../lib/audio/soundModes'

type SoundControlsProps = {
  settings: RhythmSettings
  soundMode: SoundMode
  soundModeStatus: string | null
  onSoundModeChange: (soundMode: SoundMode) => void
  onToggle: (layer: SoundLayer, enabled: boolean) => void
  onVolumeChange: (layer: SoundLayer, volume: number) => void
}

const layerLabels: Record<SoundLayer, string> = {
  stomp: 'Stomp',
  subdivision: 'Subdivision',
  accent: 'Accent',
  cycleAccent: 'Cycle accent',
}

export function SoundControls({
  settings,
  soundMode,
  soundModeStatus,
  onSoundModeChange,
  onToggle,
  onVolumeChange,
}: SoundControlsProps) {
  return (
    <section className="control-group" aria-label="Sound controls">
      <fieldset className="sound-mode-selector">
        <legend>Sound mode</legend>
        <div className="sound-mode-options">
          {soundModes.map((mode) => (
            <label key={mode.id}>
              <input
                type="radio"
                name="sound-mode"
                value={mode.id}
                checked={soundMode === mode.id}
                onChange={() => onSoundModeChange(mode.id)}
              />
              <span>{mode.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {soundModeStatus && <p className="message warning">{soundModeStatus}</p>}

      <h2>Sound layers</h2>
      <div className="sound-list">
        {SOUND_LAYERS.map((layer) => (
          <div className="sound-layer" key={layer}>
            <label className="sound-switch">
              <input
                type="checkbox"
                checked={settings.soundToggles[layer]}
                onChange={(event) => onToggle(layer, event.target.checked)}
                aria-label={`${layerLabels[layer]} sound ${settings.soundToggles[layer] ? 'on' : 'off'}`}
              />
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
                <span className="switch-state">
                  {settings.soundToggles[layer] ? 'ON' : 'OFF'}
                </span>
              </span>
              <span className="sound-layer-name">{layerLabels[layer]}</span>
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
