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

MVP includes a fixed 9-cell editable diamond, custom paths, BPM, stomp interval, stomp/subdivision/accent sound layers, toggles, volumes, active highlighting, local saving, complete pair library up to 15, true randomiser and a skinnable hand-drawn UI direction.

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
- Subdivision plays on every beat unless replaced by an enabled accent.
- Stomp is additive.
- Accent is substitutive.
- Audio toggles do not stop visual movement.
- Cell values control how many beats the cursor remains in each cell.
- One-cell paths must work.
- The pure engine should tolerate repeated path entries, but the custom path editor creates unique-cell paths only.
- Cycle length is the active path cell-value sum, measured and shown as beats.
- Empty paths must not crash.
- Mini path diamond displays the active path from initial load.
- Stop and transport Reset are the only controls intended to stop playback. BPM, stomp interval, cell values, path edits, saved/default/library/random pattern changes and sound settings apply live.
- If a path becomes empty during playback, pulse-only playback continues with no diamond accent until a path is added again.

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

## Implementation Reminder

Do not hard-code rhythm state transitions inside React components if the pure engine can own them. Components should display and edit state; the engine should define rhythm movement.

Run `npm run build` after implementation changes and run lint/tests if available.
