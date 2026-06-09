# UI Spec

Diamond Metronome should open directly into the practice tool, not a marketing landing page.

## Required Screen Layout

The UI must show:

- Title
- Play, Pause and Stop transport controls
- BPM control
- Stomp interval control with options 1 through 9
- 9-cell diamond grid
- Each cell's value
- Active cell highlight
- Selected cell editor
- Current path order available to assistive technology
- Undo path step
- Clear path
- Sound toggles for stomp, subdivision, accent and cycle accent
- Volume controls for stomp, subdivision, accent and cycle accent
- Sound mode selector with Cajon, Oscillator and Body Percussion options
- Global reset outside the transport controls
- Visual Diamond Map for ordered 1-9 pair selection
- Beat grouping indicator
- Linear rhythm pulse lanes for stomp, active path values and cycle
- Debug panel during development

## Diamond Grid

The MVP grid uses the fixed 9-cell layout documented in [02_RHYTHM_MODEL.md](02_RHYTHM_MODEL.md). Each cell should visibly communicate:

- Current numeric value
- Active playback state
- Selected editing state

Cell identity should remain available through accessible labels, but the main diamond should visibly show numeric cell values only.

Active and selected states must not rely on color alone. Use shape, outline, movement, text or other secondary cues.

## Transport And Timing Controls

- Play starts playback when the path is valid, or resumes from the current playback position after Pause.
- Pause stops playback cleanly and preserves the current playback position.
- Stop stops playback cleanly and returns playback state to the start of the current pattern.
- Global reset sits outside transport, stops playback and restores the default pattern, settings and sound mode.
- BPM may change live during playback and controls the beat rate.
- BPM input and slider should allow 30 through 480 without applying any hidden tempo multiplier.
- Sound toggles and sound volumes may change live during playback.
- Stomp interval, cell value, path edits, undo, clear, Diamond Map/random pattern changes and sound controls should apply live without stopping playback.
- Pause, Stop and Global reset are the controls that should stop playback.
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
- Show common even groupings compactly, such as `2 × 12`.
- Empty paths should show that there is no active path.
- Place the compact panel beneath the main diamond.

## Selected Cell Editor

- The selected cell value must be editable.
- Valid values are whole numbers from 1 to 15.
- Invalid values should show: `Use a whole number from 1 to 15.`

## Sound Controls

Sound controls should sit next to the main diamond on desktop and stack below it on smaller screens.

Sound controls should include a tactile segmented sound mode selector. Supported modes:

- Cajon
- Oscillator
- Body Percussion

Changing sound mode changes only the sound source. It must not change timing, rhythm state, path, cell values, cycle length or visual movement, and it must not stop playback.

Each sound layer needs:

- Labelled toggle
- Labelled volume control
- Clear role: stomp, subdivision, accent or cycle accent

The audio toggles affect only sound output. They must not stop or pause visual movement.

Cycle accent marks the start of the full active path cycle. It must be independently toggleable and have its own volume control.

Use styled on/off switches instead of default browser checkboxes. Use warm, analogue-feeling volume sliders instead of default blue browser sliders.

## Diamond Map

The Diamond Library should use a compact visual map rather than a generic dropdown. Show ordered pairs from 1 to 9 in a 9 x 9 notebook-style grid, with rows as the first number and columns as the second number. Diagonal same-number cells are muted or blank.

The selected pair should be visibly circled or marked, and its inverse should be lightly annotated. A compact summary should show the selected diamond and inverse diamond, with actions for Load selected, Load inverse and a visually separate Random diamond button. Random diamond remains a true generator, not a preset picker.

Loading a selected or inverse Diamond Map pair, or generating a random diamond, should stop playback cleanly and return the new pattern to its start.

## Rhythm Lanes

The rhythm status under the diamond should be visual first. Circular rhythm rings have been replaced by left-to-right rhythm lanes. Show horizontal lanes for:

- Stomp position inside the stomp group.
- Diamond value lanes generated from distinct cell values in the active path.
- Full cycle position, where the lane length equals the active path cycle length.

Do not show a separate Beat lane. The beat is the shared base unit for all lanes.

Do not use a single mutating Accent lane. Each visible value lane has a stable span matching its value, such as `2-beat` or `7-beat`; the value lane matching the active cell value becomes active while other value lanes remain faint guides.

Use a compact colour key generated from the actual visible lanes instead of a visible status text block. The key order should be Stomp, visible value lanes sorted by number, then Cycle. Keep concise screen-reader-only text for stomp, current cell and cycle progress.

Lanes follow scheduler-driven playback state and must not drive timing. The visualiser may use `requestAnimationFrame` interpolation between scheduler-delivered beat states for smoother left-to-right motion, but it remains UI-only. Long cycle lanes may cap rendered beat markers, such as at 64, to avoid making the UI unusable.

The left edge is the start position. Stomp resets to the left on its grouping restart, the active value lane resets to the left when entering a new cell, and Cycle returns to the left only when the full active path cycle restarts.

The main diamond area and rhythm-lane section may pulse subtly on scheduled beats. This pulse is visual only, follows scheduled rhythm events, does not drive audio timing, and should respect `prefers-reduced-motion`.

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
