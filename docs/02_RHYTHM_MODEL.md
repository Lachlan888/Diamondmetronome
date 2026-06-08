# Rhythm Model

Diamond Metronome has one master subdivision clock. In user-facing UI, this smallest counted grid unit is called a beat. Internally, the rhythm engine may continue to use tick terminology such as `globalTick`, `TickEvents` and `ticksInsideCurrentCell`.

User-facing timing language:

- Beat = the subdivision grid unit.
- BPM = beats per minute.
- Stomp every = how many beats occur between stomps.
- Cycle length = the total number of beats in the active path.
- BPM controls the beat rate, not the stomp rate.
- The stomp is a grouping of beats into a body pulse.

## Sound Layers

Stomp:

- Grounded body pulse.
- Plays every selected stomp interval of beats.
- Ignores diamond phrasing.
- Layers with subdivision or accent.

Subdivision:

- Constant time grid.
- Plays every beat unless replaced by an enabled accent.

Accent:

- Diamond movement sound.
- Plays when the cursor enters a new cell.
- Replaces subdivision only when accent is enabled.

Cycle accent:

- Full-pattern home sound.
- Plays when the cursor enters the first path cell at the start of the active path cycle.
- Replaces ordinary accent and subdivision only when cycle accent is enabled.
- If cycle accent is disabled, ordinary accent behavior still applies on the first path cell.

## Sound Priority

On each beat:

1. If a cycle accent event occurs and cycle accent sound is enabled, play cycle accent.
2. Else, if an accent event occurs and accent sound is enabled, play accent.
3. Else, if subdivision sound is enabled, play subdivision.
4. If a stomp event occurs and stomp sound is enabled, also play stomp.

Important rules:

- Stomp is additive.
- Cycle accent is substitutive.
- Cycle accent replaces ordinary accent and subdivision only when cycle accent is enabled.
- If cycle accent is disabled, accent or subdivision fallback works normally on the first path cell.
- Accent is substitutive.
- Accent replaces subdivision only when accent is enabled.
- If accent is disabled, subdivision plays normally on accent beats when subdivision is enabled.
- Audio toggles must not stop visual rhythm movement.

## Cell Values And Path Behavior

Each cell value tells the app how many beats the cursor remains in that cell before moving to the next path step.

- The path is an ordered list of valid `CellId` values.
- The pure rhythm engine can tolerate repeated path entries.
- The custom path editor should create unique-cell paths only, with each diamond cell appearing at most once.
- Path entries do not need to be adjacent.
- One-cell paths are valid.
- If an internal or loaded path repeats a cell, the repeated cell retriggers the accent when re-entered.
- Empty paths must be handled safely and must not crash playback.
- When the path reaches the end, it wraps to the beginning.
- Cycle length is measured in beats and equals the sum of the active path cell values.
- If the path becomes empty during playback, the beat/stomp/subdivision pulse may continue without diamond accents until a path is added again.

## Default Diamond

The MVP uses this fixed 9-cell layout:

```text
        top

    upperLeft     upperRight

middleLeft   centre   middleRight

    lowerLeft     lowerRight

        bottom
```

Cell IDs:

- `top`
- `upperLeft`
- `upperRight`
- `middleLeft`
- `centre`
- `middleRight`
- `lowerLeft`
- `lowerRight`
- `bottom`

Default cell values:

```ts
{
  top: 2,
  upperLeft: 3,
  upperRight: 3,
  middleLeft: 3,
  centre: 2,
  middleRight: 3,
  lowerLeft: 3,
  lowerRight: 3,
  bottom: 2,
}
```

Default path:

```ts
[
  'top',
  'upperRight',
  'middleRight',
  'upperLeft',
  'centre',
  'lowerRight',
  'middleLeft',
  'lowerLeft',
  'bottom',
]
```

The default path can be refined later. Do not block the MVP on finding the theoretically perfect path.

## Core Type Model

```ts
export type CellId =
  | 'top'
  | 'upperLeft'
  | 'upperRight'
  | 'middleLeft'
  | 'centre'
  | 'middleRight'
  | 'lowerLeft'
  | 'lowerRight'
  | 'bottom';

export type SoundLayer = 'stomp' | 'subdivision' | 'accent' | 'cycleAccent';

export type DiamondCells = Record<CellId, number>;

export type DiamondPattern = {
  id: string;
  name: string;
  cells: DiamondCells;
  path: CellId[];
};

export type RhythmSettings = {
  bpm: number;
  stompInterval: number;
  soundToggles: Record<SoundLayer, boolean>;
  soundVolumes: Record<SoundLayer, number>;
};

export type PlaybackState = {
  isPlaying: boolean;
  globalTick: number;
  currentPathIndex: number;
  ticksInsideCurrentCell: number;
  activeCellId: CellId | null;
};

export type TickEvents = {
  globalTick: number;
  stomp: boolean;
  subdivision: boolean;
  accent: boolean;
  cycleAccent: boolean;
  activeCellId: CellId | null;
  currentPathIndex: number;
  ticksInsideCurrentCell: number;
};
```

## Validation Rules

- Cell values must be integers from 1 to 15.
- Path entries must be valid `CellId` values.
- Path must not be empty for diamond playback.
- BPM must be between 30 and 480 and controls the beat rate.
- Stomp interval must be a whole number from 1 to 9 and controls only how many beats occur between stomps.
- Volumes must be between 0 and 1.
- Sound toggles must be booleans.
- Invalid saved or imported data must not crash the app.

Required user-facing messages:

- Empty path: `Add at least one cell to the path.`
- Invalid cell value: `Use a whole number from 1 to 15.`
- Missing sounds: `Some sounds could not be loaded. Check the sound files and refresh.`
- Audio placeholder, if relevant: `Audio playback will be implemented in the Web Audio scheduling pass.`

## Pure Rhythm Engine

The rhythm engine must be pure TypeScript. It must not import React, Web Audio, `localStorage`, DOM APIs, CSS or browser rendering APIs.

Required functions:

```ts
createInitialPlaybackState(pattern: DiamondPattern): PlaybackState
getCurrentCellValue(pattern: DiamondPattern, state: PlaybackState): number | null
getTickEvents(pattern: DiamondPattern, settings: RhythmSettings, state: PlaybackState): TickEvents
advancePlaybackState(pattern: DiamondPattern, state: PlaybackState): PlaybackState
```

Engine rules:

- Subdivision tick is the master timing unit.
- BPM controls the subdivision tick rate internally, shown to users as beat rate.
- Stomp interval controls stomp grouping only, not subdivision speed or diamond movement speed.
- Stomp occurs when `globalTick % stompInterval === 0`.
- Accent occurs when `ticksInsideCurrentCell === 0`.
- Cycle accent occurs when `currentPathIndex === 0`, `ticksInsideCurrentCell === 0` and `activeCellId` is not null.
- Subdivision event is true when no accent event occurs.
- Subdivision event is false on accent event ticks.
- Cell value controls how many beats the cursor remains in the active cell.
- When `ticksInsideCurrentCell` reaches the active cell value, advance to the next path index.
- When the path reaches the end, wrap to the beginning.
- One-cell paths must work.
- If a path contains repeated cells, those cells must retrigger the accent when re-entered.
- Empty paths must be handled safely.
- Pattern, path, cell value, BPM, stomp interval and sound setting changes should apply live during playback. Pause stops playback while preserving the current cycle position. Stop stops playback and returns the rhythm cycle to the beginning. Global reset stops playback and restores app defaults without deleting the saved local pattern.

## Audio Timing Requirement

Final audio playback must use Web Audio scheduling with `AudioContext.currentTime`.

Do not drive final audio timing from React state, CSS animation, direct `setInterval` sound triggering or visual timers.

A `setInterval` may be used only as a lookahead loop that schedules Web Audio events ahead of time.

Recommended scheduler constants:

```ts
const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
```

Tempo formula:

```text
seconds per subdivision tick = 60 / bpm
stomp occurs every stompInterval subdivision ticks
```

The UI should present this as beats per minute and beats between stomps. Do not use a hidden tempo multiplier: displayed BPM is the actual beat/subdivision-grid rate.

## Temporary Visual Simulation

Before final Web Audio scheduling, a temporary visual timer may be used for UI and rhythm debugging only.

This timer is temporary and must be replaced by Web Audio scheduling for final audio playback.
