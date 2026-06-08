# Audio Module

Web Audio scheduling is implemented with selectable sound modes.

Final audio playback must use `AudioContext.currentTime` with a lookahead scheduler. A timer may be used only to schedule Web Audio events ahead of time, not to directly trigger final audio sounds.

Current sound modes:

- Cajon: loads `public/sounds/cajon/stomp.wav`, `subdivision.wav`, `accent.wav` and `cycle-accent.wav`.
- Oscillator: generated tone mode for timing checks.
- Body Percussion: future sample mode for `public/sounds/body`; falls back when files are missing.

Expected future responsibilities:

- Add Body Percussion samples in `public/sounds/body`
- Apply sound priority rules
- Schedule stomp, subdivision, accent and cycle accent events from the pure rhythm engine
