# UI Spec

Diamond Metronome should open directly into the practice tool, not a marketing landing page.

## Required Screen Layout

The UI must show:

- Title
- Play, Stop and Reset controls
- BPM control
- Stomp interval control with options 1 through 9
- 9-cell diamond grid
- Each cell's value
- Active cell highlight
- Selected cell editor
- Current path order available to assistive technology
- Undo path step
- Clear path
- Sound toggles for stomp, subdivision and accent
- Volume controls for stomp, subdivision and accent
- Save current
- Load saved
- Reset default
- Beat grouping indicator
- Debug panel during development

## Diamond Grid

The MVP grid uses the fixed 9-cell layout documented in [02_RHYTHM_MODEL.md](02_RHYTHM_MODEL.md). Each cell should visibly communicate:

- Current numeric value
- Active playback state
- Selected editing state

Cell identity should remain available through accessible labels, but the main diamond should visibly show numeric cell values only.

Active and selected states must not rely on color alone. Use shape, outline, movement, text or other secondary cues.

## Transport And Timing Controls

- Play starts playback when the path is valid.
- Stop stops playback cleanly.
- Transport Reset stops playback and returns playback state to the start of the current pattern.
- BPM may change live during playback and controls the beat rate.
- BPM input and slider should allow 30 through 480 without applying any hidden tempo multiplier.
- Sound toggles and sound volumes may change live during playback.
- Stomp interval, cell value, path edits, undo, clear, saved/default/library/random pattern changes and sound controls should apply live without stopping playback.
- Stop and transport Reset are the only controls that should stop playback.
- If the path is cleared during playback, keep the beat/stomp/subdivision pulse stable if possible, show `Add at least one cell to the path.`, and suppress diamond accents until a path exists again.

## Cell Clicking

- Clicking a cell selects it.
- Clicking a cell appends it to the current custom path only if it is not already in that custom path.
- Repeated cells are not created by the custom path editor.
- Non-adjacent cells are allowed.

## Path Editor

- Make the current path order available to assistive technology.
- The mini path diamond displays the active path order from initial load, including the default path.
- Undo removes the last path step.
- Clear empties the path.
- One-cell paths are valid.
- Cells already used in the visible custom path show their path number and do not append again when clicked.
- Empty paths must not crash.
- Empty paths should show: `Add at least one cell to the path.`

## Cycle Length Panel

- Show cycle length as the sum of active path cell values, measured and shown as beats.
- Show common even groupings as `group beats x count`, such as `2 beats x 12`.
- Empty paths should show that there is no active path.
- On desktop, place the panel to the right of the main diamond; on mobile, stack it below.

## Selected Cell Editor

- The selected cell value must be editable.
- Valid values are whole numbers from 1 to 15.
- Invalid values should show: `Use a whole number from 1 to 15.`

## Sound Controls

Each sound layer needs:

- Labelled toggle
- Labelled volume control
- Clear role: stomp, subdivision or accent

The audio toggles affect only sound output. They must not stop or pause visual movement.

## Beat Grouping Indicator And Debug Panel

The beat grouping indicator should make the counted beat visible. The debug panel is allowed during development and may keep internal tick terminology when exposing engine state, such as:

- Global tick
- Current path index
- Active cell
- Ticks inside current cell
- Current tick events

The debug panel can be removed or hidden later, but it is useful during MVP development.

## Accessibility Basics

- Buttons have clear labels.
- Controls are keyboard reachable.
- Focus state is visible.
- Sound toggles identify the sound layer.
- Volume controls are labelled.
- Active cell is available as text.
- Current path is available as text.
- Active state does not rely only on color.
- Selected state does not rely only on color.
- Avoid excessive screen reader announcements on every fast beat.
