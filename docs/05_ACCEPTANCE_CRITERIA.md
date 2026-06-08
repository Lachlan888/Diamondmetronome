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
- Accent replaces subdivision only when accent is enabled.
- If accent is disabled, subdivision plays normally on accent beats when subdivision is enabled.
- Stomp layers with subdivision or accent.
- One-cell paths work.
- Repeated cells work and retrigger accent on re-entry.
- Empty paths are handled clearly and safely.
- Invalid input is handled safely.

## Audio

- App eventually plays stomp, subdivision and accent sounds.
- Audio timing eventually uses Web Audio scheduling.
- Final audio timing is not driven by React state, CSS animation or direct `setInterval` sound triggering.
- App reports missing sounds with: `Some sounds could not be loaded. Check the sound files and refresh.`
- App runs for 5 minutes without obvious drift once audio exists.

## Visual And Interaction

- Active cell updates in sync with playback.
- Stomp visual pulse is visible.
- Subdivision indicator is visible.
- User can edit cell values.
- User can create a custom path by clicking cells.
- User can undo path steps.
- User can clear the path.
- Sound layers are independently toggleable.
- Sound layers have volume controls.
- BPM can change live during playback.
- Stomp interval can change live during playback without changing beat speed.
- Cell values, path edits, undo, clear and pattern/library/random changes can apply live without stopping playback.
- Stop and transport Reset are the only controls that stop playback.
- Sound toggles and volumes can change live during playback.
- Empty paths do not play diamond accents and do not crash playback.

## Persistence And Library

- User can save and reload at least one pattern locally.
- Invalid saved data does not crash the app.
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
- Active and selected states do not rely only on color.
- Fast beats do not cause excessive screen reader announcements.

## Build

- `npm run build` passes.
- Lint and tests pass if available.
- Future implementation changes are tested in small phases, especially around rhythm state and audio scheduling.
