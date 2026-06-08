# Sound Asset Guide

Diamond Metronome expects three sound files in `public/sounds/`.

```text
public/sounds/stomp.wav
public/sounds/subdivision.wav
public/sounds/accent.wav
```

## Sound Roles

Stomp:

- Low and grounded.
- Foot stomp or low body thump.
- Should feel like the body pulse.

Subdivision:

- Light and precise.
- Finger click, light tap or hi-hat equivalent.
- Should clearly mark every subdivision tick without dominating.

Accent:

- Mid-range and obvious.
- Clap or chest tap.
- Should clearly mark cell entry and diamond movement.

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

If any required sound cannot be loaded, show:

`Some sounds could not be loaded. Check the sound files and refresh.`

Before the Web Audio scheduling pass, it is acceptable to show:

`Audio playback will be implemented in the Web Audio scheduling pass.`

## Mixing Guidance

The three sounds should occupy different perceptual spaces:

- Stomp: lower, warmer, heavier.
- Subdivision: lighter, shorter, quieter.
- Accent: clearer and more present than subdivision.

Avoid long tails, heavy reverb or sounds with slow attacks. The rhythm depends on crisp timing.
