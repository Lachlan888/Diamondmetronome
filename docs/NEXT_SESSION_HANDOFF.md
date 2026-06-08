# Next Session Handoff

## Current App Status

Diamond Metronome is a local Vite + React + TypeScript app. It is local-first, has no backend, no Supabase, no auth, no database and no Vercel configuration.

The app opens directly into the practice tool. The main diamond shows numeric cell values only. The mini path diamond displays the current active path from initial load, including the default path.

## Features Implemented

- Unified 9-cell main diamond.
- Numeric-only main diamond cells with accessible cell labels.
- Mini path diamond editor with order numbers.
- Unique-cell custom path rule.
- Web Audio lookahead scheduler.
- Temporary oscillator bleep/boop sounds.
- Live BPM changes during playback.
- Live Stomp every changes during playback.
- Live cell value, path and pattern changes during playback.
- Pulse-only playback when a path becomes empty during playback.
- Sound layer toggles and volumes.
- Local one-pattern save/load/reset.
- Diamond library up to 15.
- Inverse loading.
- True random diamond generation using all nine cells exactly once.
- Cycle length and even grouping panel.
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
- Stop and transport Reset are the only controls intended to stop playback.

## Known Issues And Manual Checks

- WAV/body-percussion sample loading is not implemented.
- Cycle Finder is documented only; it is not implemented.
- Empty path during playback should keep stomp/subdivision pulse and suppress accents.
- Clearing an empty path still blocks starting playback from Stop state.
- Test high BPM values manually, especially 300-480.
- Check that loading saved/default/library/random patterns during playback does not stop the beat clock.

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
- Load saved, Reset default, Load diamond, Load inverse and Random diamond apply live.
- Stop stops playback.
- Transport Reset stops playback and returns to the start.
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
