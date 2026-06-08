# Sound Asset Guide

Diamond Metronome supports sound modes.

Current modes:

- Cajon: sample mode using files in `public/sounds/cajon`.
- Oscillator: generated tone mode for clean timing checks.
- Body Percussion: future sample mode using files in `public/sounds/body`; it may fall back to Oscillator until files exist.

## Cajon Sample Pack

Current Cajon files:

```text
public/sounds/cajon/stomp.wav
public/sounds/cajon/subdivision.wav
public/sounds/cajon/accent.wav
public/sounds/cajon/cycle-accent.wav
```

Mapping:

- `stomp.wav` = cajon thump, grouped body pulse.
- `subdivision.wav` = cajon snare, counted beat grid.
- `accent.wav` = cajon rimshot, diamond cell entry.
- `cycle-accent.wav` = cajon thud, start of full path cycle.

## Body Percussion Future Pack

Future Body Percussion files:

```text
public/sounds/body/stomp.wav
public/sounds/body/subdivision.wav
public/sounds/body/accent.wav
public/sounds/body/cycle-accent.wav
```

## Sound Roles

Stomp:

- Low and grounded.
- Foot stomp or low body thump.
- Should feel like the body pulse.

Subdivision:

- Light and precise.
- Finger click, light tap or hi-hat equivalent.
- Should clearly mark every counted beat without dominating.

Accent:

- Mid-range and obvious.
- Clap or chest tap.
- Should clearly mark cell entry and diamond movement.

Cycle accent:

- Stronger but still short and controlled.
- Stronger clap, low knock or home body-percussion sound.
- Should clearly mark the beginning of the full path cycle.

## Recommended File Properties

- WAV format.
- Mono preferred.
- 44.1 kHz or 48 kHz.
- Short duration, ideally under 0.5 seconds.
- Tightly trimmed start.
- Tiny fade-out.
- No clipping.
- Clearly distinguishable sounds.

## Loading And Error Handling

If a sample mode cannot load every required sound, it should fall back to Oscillator mode and show an inline message naming the unavailable mode.

## Mixing Guidance

The four sounds should occupy different perceptual spaces:

- Stomp: lower, warmer, heavier.
- Subdivision: lighter, shorter, quieter.
- Accent: clearer and more present than subdivision.
- Cycle accent: distinct from accent, slightly stronger or more grounded, but not painfully loud.

Avoid long tails, heavy reverb or sounds with slow attacks. The rhythm depends on crisp timing.
