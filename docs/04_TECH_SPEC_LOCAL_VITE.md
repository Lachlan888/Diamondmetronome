# Tech Spec - Local Vite

Diamond Metronome is an existing local-first Vite, React and TypeScript app. Keep the stack local while building the MVP.

## Stack

- Vite
- React
- TypeScript
- CSS, or Tailwind only if already present
- Web Audio API later
- GitHub
- Local development first

Do not convert the project to Next.js.

Do not add Vercel configuration yet. Future deployment may happen later.

## Recommended Folders

Use the existing app structure where possible. Suggested additions when implementation begins:

```text
src/
  lib/
    rhythm/
      types.ts
      constants.ts
      validation.ts
      engine.ts
      diamondLibrary.ts
      randomDiamond.ts
    audio/
      audioBuffers.ts
      scheduler.ts
      soundPriority.ts
  components/
    DiamondGrid.tsx
    TransportControls.tsx
    TimingControls.tsx
    PathEditor.tsx
    SoundControls.tsx
```

These are suggestions, not a mandate. Prefer the repo's emerging patterns if they differ.

## Pure Rhythm Engine Boundary

The rhythm engine must be pure TypeScript and must not import:

- React
- Web Audio
- `localStorage`
- DOM APIs
- CSS
- Browser rendering APIs

The engine should accept plain data and return plain data. This keeps rhythm behavior testable and independent from UI and audio scheduling.

## Web Audio Scheduler Later

Audio playback uses Web Audio scheduling with `AudioContext.currentTime`.

A `setInterval` can be used only as a lookahead loop that schedules audio ahead of time. It must not directly trigger final audio sounds.

Recommended constants:

```ts
const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
```

Internal tempo formula:

```text
seconds per subdivision tick = 60 / bpm
stomp occurs every stompInterval subdivision ticks
```

BPM controls the subdivision tick rate internally. The stomp interval controls only how many subdivision ticks occur between stomps; changing stomp interval must not change subdivision speed or diamond movement speed.

The UI should present the subdivision grid unit as a beat: BPM is beats per minute, and stomp interval is beats between stomps. Internal scheduler and rhythm code may keep tick terminology.

Valid BPM range is 30 through 480. Displayed BPM must be the actual beat/subdivision-grid rate; do not secretly multiply or divide it before scheduling.

The scheduler should read the latest pattern and settings through mutable scheduler state or refs so live changes do not require stopping playback. Pattern changes should normalize playback state safely for the new path without resetting the underlying beat clock.

## Temporary Sounds

Temporary oscillator bleep/boop sounds are currently used for local testing.

Real WAV body-percussion sample loading is not implemented yet.

## Persistence

Pattern save/load is not part of the current MVP scope. Pattern exploration happens through the Diamond Map, Load selected, Load inverse, Random diamond and direct manual editing.

Unrelated local preferences, such as sound mode, may use browser storage if already implemented.

No backend service is part of the MVP.

## Backend Boundary

Do not add:

- Supabase
- Database
- Auth
- Cloud saving
- API routes
- Server actions
- Backend persistence
- Multi-user features

Keep Diamond Metronome a local browser app until deployment or backend scope is explicitly requested.
