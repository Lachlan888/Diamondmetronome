# Acceptance Criteria

The MVP is acceptable when the following checks pass.

## Product

- App opens locally.
- App presents itself as Diamond Metronome.
- App uses neutral independent-tool positioning.
- App does not present itself as an official Greg Sheehan product or a replacement for his teaching materials.

## Rhythm

- App displays a fixed 9-cell rhythm diamond.
- Stomp follows the stomp interval setting.
- BPM controls the beat rate, and changing stomp interval does not change beat speed or diamond movement speed.
- BPM accepts values from 30 through 480, and displayed BPM is the actual beat rate.
- Subdivision plays on the time grid.
- Accent marks diamond cell entry.
- Cycle accent marks the first beat of the active path cycle.
- Accent replaces subdivision only when accent is enabled.
- Cycle accent replaces ordinary accent/subdivision on cycle-start beats only when cycle accent is enabled.
- If cycle accent is disabled, ordinary accent/subdivision fallback still works on the first path cell.
- If accent is disabled, subdivision plays normally on accent beats when subdivision is enabled.
- Stomp layers with subdivision or accent.
- One-cell paths work.
- Repeated cells work and retrigger accent on re-entry.
- Empty paths are handled clearly and safely.
- Invalid input is handled safely.

## Audio

- App plays temporary oscillator stomp, subdivision, accent and cycle accent sounds.
- App can play the Cajon sample pack from `public/sounds/cajon`.
- Oscillator mode remains available as a valid clean test mode.
- Body Percussion mode falls back gracefully until its sample pack exists.
- Audio timing uses Web Audio lookahead scheduling.
- Final audio timing is not driven by React state, CSS animation or direct `setInterval` sound triggering.
- App reports unavailable sample packs with an inline fallback message.
- App runs for 5 minutes without obvious drift.

## Visual And Interaction

- Active cell updates in sync with playback.
- Stomp visual pulse is visible.
- Linear rhythm pulse lanes are visible.
- Stomp, current cell and cycle positions update during playback.
- There is no separate Beat lane.
- There is no single mutating Accent lane.
- Diamond value lanes are generated from distinct active path cell values.
- The active value lane matches the active cell value.
- The stomp lane length follows the Stomp every setting.
- The cycle lane represents the full active path cycle length.
- Rhythm lanes use left-to-right playheads and a dynamic compact colour key instead of a visible status text block.
- User can edit cell values.
- User can create a custom path by clicking cells.
- User can undo path steps.
- User can clear the path.
- Sound layers are independently toggleable.
- Sound layers have volume controls.
- User can choose Cajon, Oscillator or Body Percussion sound mode.
- Sound mode control is styled as an integrated selector rather than a plain browser select.
- Sound layer toggles use styled on/off switches rather than default blue checkboxes.
- Changing sound mode does not stop playback.
- Cycle accent can be toggled independently and has a volume control.
- BPM can change live during playback.
- Stomp interval can change live during playback without changing beat speed.
- Cell values, path edits, undo, clear and pattern/library/random changes can apply live without stopping playback.
- Play resumes from Pause where practical.
- Pause stops playback while preserving position.
- Stop stops playback and returns the rhythm cycle to the beginning.
- Global reset exists outside transport and restores app defaults.
- Sound toggles and volumes can change live during playback.
- Empty paths do not play diamond accents and do not crash playback.

## Library And Randomiser

- User can choose from the complete ordered diamond pair library up to 15.
- User can load a diamond pair and its inverse.
- Loaded diamonds remain editable.
- User can generate a true random diamond.
- Random diamond paths contain all nine cells exactly once.
- The randomiser does not simply choose a preset from the diamond library.

## Accessibility

- Buttons have clear labels.
- Controls are keyboard reachable.
- Focus state is visible.
- Sound toggles identify the sound layer.
- Volume controls are labelled.
- Active cell is available as text.
- Current path is available as text.
- Rhythm lane state is available to screen readers even though the visible lane area is primarily graphical.
- Active and selected states do not rely only on color.
- Fast beats do not cause excessive screen reader announcements.

## Build

- `npm run build` passes.
- Lint and tests pass if available.
- Future implementation changes are tested in small phases, especially around rhythm state and audio scheduling.
