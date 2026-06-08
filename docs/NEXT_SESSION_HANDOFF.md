# Next Session Handoff

## Current App Status

Diamond Metronome is a local Vite + React + TypeScript app. It is local-first, has no backend, no Supabase, no auth, no database and no Vercel configuration.

The app opens directly into the practice tool. The main diamond shows numeric cell values only. The mini path diamond displays the current active path from initial load, including the default path.

## Features Implemented

- Unified 9-cell main diamond.
- Numeric-only main diamond cells with accessible cell labels.
- Mini path diamond editor with order numbers.
- Unique-cell custom path rule.
- Play/Pause/Stop transport model.
- Web Audio lookahead scheduler.
- Temporary oscillator bleep/boop sounds.
- Cycle accent sound layer for full path starts.
- Cajon sample mode using `public/sounds/cajon`.
- Segmented sound mode selector with Cajon, Oscillator and Body Percussion.
- Live BPM changes during playback.
- Live Stomp every changes during playback.
- Live cell value, path and pattern changes during playback.
- Pulse-only playback when a path becomes empty during playback.
- Styled sound layer switches and volumes.
- Local one-pattern save/load.
- Global reset for app defaults.
- Diamond library up to 15.
- Inverse loading.
- True random diamond generation using all nine cells exactly once.
- Compact cycle length panel beneath the diamond.
- Linear rhythm lanes for stomp, active path value lanes and cycle position.
- Development debug panel.

## Important Model Decisions

- User-facing language says beat, not tick.
- Internal rhythm code may keep tick terminology such as `globalTick`, `TickEvents` and `ticksInsideCurrentCell`.
- BPM is the counted beat rate. It is not the stomp rate.
- `secondsPerBeat = 60 / bpm`.
- Stomp every controls how many beats occur between stomps.
- Changing Stomp every must not change beat speed.
- Cell values are beat durations.
- Cycle length is the sum of active path cell values in beats.
- There is no separate Beat lane; beats are the shared base unit.
- The stomp rhythm lane length is the Stomp every value.
- There is no single mutating Accent lane.
- Value rhythm lanes are generated from distinct active path cell values.
- The active value lane is selected from the active cell value.
- The cycle rhythm lane length is the full active path cycle length.
- The left edge of each rhythm lane is the start point.
- Rhythm lanes are display-only and use requestAnimationFrame-smoothed left-to-right playheads plus a dynamic compact colour key.
- Main diamond and rhythm-lane panel pulse subtly on scheduled beats; stomp beats are slightly stronger.
- Play starts or resumes. Pause stops playback while preserving position. Stop stops playback and returns the rhythm cycle to the beginning. Global reset stops playback and restores app defaults without deleting the saved local pattern.

## Known Issues And Manual Checks

- Body Percussion sample loading is not implemented.
- Body Percussion mode currently falls back to Oscillator because `public/sounds/body` is not present.
- Cycle Finder is documented only; it is not implemented.
- Empty path during playback should keep stomp/subdivision pulse and suppress accents.
- Clearing an empty path still blocks starting playback from Stop state.
- Test high BPM values manually, especially 300-480.
- Check that loading saved/library/random patterns during playback does not stop the beat clock.
- Check that Global reset stops playback and restores defaults without deleting the saved local pattern.
- Check that switching sound modes during playback does not stop the beat clock.

## Next Recommended Prompts

- Implement WAV body-percussion sample loading while preserving the scheduler.
- Add focused rhythm engine tests for empty paths, one-cell paths and live path normalization.
- Add Cycle Finder only after reading `docs/12_CYCLE_FINDER_ADDENDUM.md`.
- Refine mobile layout and accessibility once core behavior is stable.
- Replace or hide the development debug panel for a production pass.

## Manual Regression Checklist

- Initial load shows default path numbers 1-9 in the mini path diamond.
- Main diamond cells show only numbers.
- Play starts audio and visual playback.
- BPM changes live without stopping.
- Stomp every changes live without changing beat speed.
- Cell value changes apply live.
- Path edits, undo and clear apply live.
- Empty path shows `Add at least one cell to the path.`
- Empty path plays no diamond accents.
- Adding a cell after empty path resumes accents without pressing Play again.
- Load saved, Load diamond, Load inverse and Random diamond apply live.
- Pause stops playback without returning to the start.
- Stop stops playback and returns to the start.
- Global reset restores app defaults.
- Rhythm lanes show only the visual lanes and compact colour key, with lane status available to screen readers.
- Save/load still works.
- `npm run build` passes.
- `npm run lint` passes.

## Files Most Likely To Matter Next

- `src/components/AppShell.tsx`
- `src/components/PathEditor.tsx`
- `src/components/DiamondCell.tsx`
- `src/lib/rhythm/engine.ts`
- `src/lib/rhythm/patterns.ts`
- `src/lib/rhythm/diamondLibrary.ts`
- `src/lib/rhythm/randomDiamond.ts`
- `src/lib/audio/scheduler.ts`
- `src/lib/audio/testToneEngine.ts`
- `src/lib/storage/localPatterns.ts`
- `docs/02_RHYTHM_MODEL.md`
- `docs/03_UI_SPEC.md`
- `docs/09_ENGINEERING_HANDOFF.md`
