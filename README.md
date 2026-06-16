# Diamond Metronome

Diamond Metronome is a local-first Vite + React + TypeScript rhythm practice app.

It is an independent browser-based tool for exploring diamond-shaped rhythm patterns, editable cell values, custom paths, a counted beat grid, body-pulse grouping, accent movement and cycle-start accents.

## Current Status

Implemented:

- Unified 9-cell diamond display with numeric values only.
- Mini path diamond editor that displays the current active path from initial load.
- Unique-cell custom path editing.
- BPM input and slider, 30 through 480.
- Stomp every 1 through 9 beat grouping.
- Play, Pause and Stop transport with Stop returning the cycle to the start.
- Web Audio lookahead scheduler.
- Temporary oscillator test sounds for stomp, subdivision, accent and cycle accent.
- Cajon sample mode using `public/sounds/cajon`.
- Segmented sound mode selector with Cajon, Oscillator and Body Percussion.
- Sound toggles and volume controls.
- Live BPM, stomp interval, cell value, path and pattern changes during playback.
- Global reset that restores app defaults.
- Visual Diamond Map for ordered 1-15 pair selection, inverse loading and true random diamond generation.
- Compact cycle length panel and linear rhythm pulse lanes with a dynamic colour key.
- Development debug panel.

Not yet implemented:

- Body Percussion sample pack.
- Cycle Finder implementation.
- Import/export.
- Deployment.
- Backend or cloud features.

## Development

```sh
npm install
npm run dev
```

Build check:

```sh
npm run build
```

Lint check:

```sh
npm run lint
```

## Project Docs

Start here:

- [docs/00_PROJECT_INDEX.md](docs/00_PROJECT_INDEX.md)
- [docs/NEXT_SESSION_HANDOFF.md](docs/NEXT_SESSION_HANDOFF.md)

Diamond Metronome remains local-first. Do not add Next.js, Vercel configuration, Supabase, auth, a database, API routes, server actions or backend services unless explicitly requested.
