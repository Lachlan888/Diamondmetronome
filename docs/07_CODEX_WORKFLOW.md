# Codex Workflow

These rules are for future Codex sessions working on Diamond Metronome.

## Before Making Changes

1. Read [00_PROJECT_INDEX.md](00_PROJECT_INDEX.md).
2. Read [09_ENGINEERING_HANDOFF.md](09_ENGINEERING_HANDOFF.md).
3. Read any specific docs relevant to the task.
4. Inspect the current repo state.
5. Keep the change small and scoped.
6. Do not add new product scope unless explicitly requested.

## Scope Rules

Do not add Supabase, auth, a database, server actions, API routes, MIDI, VST or AU support, DAW sync, cloud saving, notation editing, sample upload, community sharing, mobile-native packaging, backend services or Vercel configuration unless explicitly requested.

Do not convert the app to Next.js.

## During Implementation

- Prefer existing repo patterns.
- Keep rhythm logic separate from UI, audio, storage and skinning.
- Keep the rhythm engine pure TypeScript.
- Use temporary visual timers only for pre-audio debugging.
- Use Web Audio scheduling for final audio playback.
- Validate saved/imported data before using it.
- Stop playback cleanly before mutating path, cell values, stomp interval, loaded library diamonds or random diamonds.

## After Making Changes

1. Run `npm run build`.
2. Run lint/tests if available.
3. Report files changed.
4. Report what works.
5. Report known issues.
6. Report the next recommended action.

Do not stack many large implementation changes without testing, especially once audio scheduling is involved.
