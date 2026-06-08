# Audio Module Placeholder

Web Audio scheduling will be implemented in a later pass.

Final audio playback must use `AudioContext.currentTime` with a lookahead scheduler. A timer may be used only to schedule Web Audio events ahead of time, not to directly trigger final audio sounds.

Expected future responsibilities:

- Load `public/sounds/stomp.wav`
- Load `public/sounds/subdivision.wav`
- Load `public/sounds/accent.wav`
- Apply sound priority rules
- Schedule stomp, subdivision and accent events from the pure rhythm engine
