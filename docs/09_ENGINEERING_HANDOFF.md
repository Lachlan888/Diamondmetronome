# Engineering Handoff

This is the compact orientation for future implementation work.

## Non-Negotiables

- Product name is Diamond Metronome.
- Stack remains local Vite, React and TypeScript.
- Do not convert to Next.js.
- Do not add Vercel configuration yet.
- Do not add backend services.
- Keep implementation local-first.
- Keep the rhythm engine pure TypeScript.
- Final audio timing must use Web Audio scheduling.
- The app is independent and must not claim to be an official Greg Sheehan product.

## Product Boundary

MVP includes a fixed 9-cell editable diamond, custom paths, BPM, stomp interval, stomp/subdivision/accent/cycle accent sound layers, toggles, volumes, active highlighting, local saving, complete pair library up to 15, true randomiser and a skinnable hand-drawn UI direction.

Current sound modes are Cajon, Oscillator and Body Percussion. Cajon uses `public/sounds/cajon/*.wav`; Oscillator is a valid generated test mode; Body Percussion is a future sample pack and may fall back to Oscillator when files are missing.

MVP excludes Supabase, database, auth, cloud saving, API routes, server actions, MIDI, VST/AU, DAW sync, notation export, sample upload, multi-user features, community sharing, mobile-native packaging and deployment configuration.

## Rhythm Rules

- One master subdivision clock.
- User-facing UI calls the subdivision grid unit a beat.
- Internal rhythm code may keep tick terminology such as `globalTick` and `TickEvents`.
- BPM controls beat speed.
- Valid BPM range is 30 through 480, with no hidden display-to-playback multiplier.
- Stomp interval controls stomp grouping only, not beat speed or diamond movement speed.
- Stomp occurs when `globalTick % stompInterval === 0`.
- Accent occurs when entering a cell.
- Cycle accent occurs when entering the first cell of the active path cycle.
- Subdivision plays on every beat unless replaced by an enabled accent.
- Stomp is additive.
- Cycle accent is substitutive and has priority over ordinary accent.
- Accent is substitutive.
- Audio toggles do not stop visual movement.
- Cell values control how many beats the cursor remains in each cell.
- One-cell paths must work.
- The pure engine should tolerate repeated path entries, but the custom path editor creates unique-cell paths only.
- Cycle length is the active path cell-value sum, measured and shown as beats.
- Empty paths must not crash.
- Mini path diamond displays the active path from initial load.
- Play starts or resumes playback. Pause stops playback while preserving the current cycle position. Stop stops playback and returns the rhythm cycle to the beginning. Global reset stops playback and restores app defaults without deleting the saved local pattern. BPM, stomp interval, cell values, path edits, saved/library/random pattern changes and sound settings apply live.
- If a path becomes empty during playback, pulse-only playback continues with no diamond accent until a path is added again.

## UI Layout Notes

Desktop layout should keep transport, timing and path editing on the left, the main diamond in the centre, and compact sound controls on the right. Cycle length and the rhythm pulse display sit beneath the main diamond. Sound mode should use an integrated segmented selector, and sound toggles should use styled on/off switches instead of default browser checkboxes.

Rhythm lanes are display-only visuals. They do not drive timing. Circular rings were replaced by left-to-right lanes. The model is Stomp, one or more diamond value lanes, and Cycle. Stomp shows progress through the current stomp grouping and uses `settings.stompInterval` as its lane length. Value lanes are generated from distinct cell values in the active path; the lane matching the active cell value becomes active while other value lanes stay faint. Cycle shows progress through the full active path cycle. Visible lane status text is replaced by a compact colour key generated from the actual visible lanes, with screen-reader-only status retained.

`RhythmLanes` uses `requestAnimationFrame` to interpolate CSS playhead positions between scheduler-delivered visual beat states. This is visual smoothing only; Web Audio scheduling and the pure rhythm engine remain the timing sources.

The main diamond wrapper and rhythm-lane panel pulse subtly from scheduled visual tick events. This is a CSS-only visual response keyed from React state in `AppShell`; it does not add timers or alter audio/rhythm timing. Reduced-motion preference removes the scale/throb and keeps only a slight brightness change.

The left edge of each lane is the start point. Active value lanes reset cleanly to the left on cell entry rather than tweening backward from the previous cell's position.

## Architecture

Recommended implementation order:

1. Types and constants.
2. Validation.
3. Pure rhythm engine.
4. Basic UI.
5. Temporary visual simulation.
6. Temporary oscillator audio and Web Audio scheduler.
7. Visual sync.
8. Local storage.
9. Diamond library and randomiser.
10. Skinning and accessibility.

Important modules include `src/lib/rhythm/engine.ts`, `src/lib/rhythm/validation.ts`, `src/lib/rhythm/diamondLibrary.ts`, `src/lib/rhythm/randomDiamond.ts`, `src/lib/audio/scheduler.ts`, `src/lib/audio/testToneEngine.ts` and `src/lib/storage/localPatterns.ts`.

Audio mode modules include `src/lib/audio/soundModes.ts` and `src/lib/audio/sampleLoader.ts`.

## Implementation Reminder

Do not hard-code rhythm state transitions inside React components if the pure engine can own them. Components should display and edit state; the engine should define rhythm movement.

Run `npm run build` after implementation changes and run lint/tests if available.
