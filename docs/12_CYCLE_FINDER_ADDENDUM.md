# Cycle Finder Addendum

Cycle Finder is a future recommendation feature. Do not implement it until it is explicitly requested.

Allowed user-facing labels include:

- Cycle Finder
- Diamond Finder
- Find diamonds by cycle length

Do not describe this feature as a strict time signature generator. It can support time-signature-like thinking, but the safer product language is bar fit, cycle fit and beat grouping.

## Purpose

Cycle Finder helps the user ask questions like:

- What diamonds fit a 32-beat cycle?
- What diamonds fit 4 bars of 4?
- What diamonds fit 3 bars of 7?
- What diamonds fit 2 bars of 12?
- What diamonds get close to 64 beats?
- Which 15-limit diamonds create a cycle divisible by 4, 6 or 8?

The feature should return useful diamond and path options without changing the existing rhythm engine, scheduler, tempo model or playback behavior.

## User-Facing Timing Model

Use beat language in the UI.

- Beat = smallest counted grid unit.
- BPM = beats per minute.
- Stomp every = how many beats occur between stomps.
- Cycle length = total number of beats in the active pattern.
- Bar fit = whether the cycle divides evenly into groups of N beats.

Internal rhythm code may keep tick terminology if already established.

## Input Modes

### Mode 1: Direct Cycle Length

The user enters:

```ts
targetCycleLengthBeats: number
```

Example:

```text
Target cycle length: 32 beats
```

### Mode 2: Bar Structure

The user enters:

```ts
beatsPerBar: number
numberOfBars: number
```

The app calculates:

```text
targetCycleLengthBeats = beatsPerBar * numberOfBars
```

Examples:

- 4 bars of 4 = 16 beats
- 4 bars of 8 = 32 beats
- 3 bars of 7 = 21 beats
- 5 bars of 5 = 25 beats

## Core Calculation

Cycle length is calculated as:

```text
cycleLength = sum of cell values in the active path
```

For a full 9-cell path using all cells once:

```text
cycleLength = sum of all 9 diamond cell values
```

Under the current simple pair mapping:

```text
top = A
centre = A
bottom = A

upperLeft = B
upperRight = B
middleLeft = B
middleRight = B
lowerLeft = B
lowerRight = B
```

So the full 9-cell cycle length is:

```text
fullCycleLength = 3A + 6B
```

Examples:

```text
10/9 Diamond:
3 x 10 + 6 x 9 = 84 beats

9/10 Diamond:
3 x 9 + 6 x 10 = 87 beats
```

Inverse diamonds can have different cycle lengths and should both be considered.

## Recommendation Modes

### 1. Exact Full-Diamond Matches

Find diamonds where the full 9-cell path length exactly equals the target.

Example:

```text
target = 24 beats
find pairs where 3A + 6B = 24
```

### 2. Near Full-Diamond Matches

If no exact matches exist, show nearest options.

Example:

```text
target = 32 beats
nearest:
30 beats
33 beats
36 beats
```

Each result should show distance from the target.

### 3. Custom Path Matches

Find paths within a diamond that match the target length using a subset of cells.

Because the current path editor uses each cell once, a custom path candidate should use each cell at most once.

For the simple future version:

- Use subset search, not permutation search, because path order does not affect cycle length.
- Once a matching subset is found, suggest a sensible path order through those cells.
- Do not generate thousands of path permutations.

Example:

```text
Diamond 5/3 has:
three cells with 5
six cells with 3

target = 16 beats
5 + 5 + 3 + 3 = 16
```

The app can recommend:

```text
Use top, centre, upperRight, middleRight
```

or another readable path using that subset.

## Ranking

Recommendations should be ranked. A simple ranking is fine; avoid overfitting.

Suggested priorities:

1. Exact target match.
2. Full 9-cell path match preferred over subset match, unless the user requests custom paths.
3. Smaller distance from target.
4. Simpler pair values.
5. Pair values within selected max range.
6. Balanced diamonds, where A and B are not wildly far apart.
7. Musically useful bar fit, especially divisibility by 2, 3, 4, 6, 8 or 12.

## Suggested Pure Module

Suggested future module:

```text
src/lib/rhythm/cycleFinder.ts
```

Keep this module pure TypeScript. It should not import React, Web Audio, localStorage, DOM APIs, CSS or browser rendering APIs.

## Suggested Types

```ts
export type CycleFinderInput =
  | {
      mode: 'cycleLength';
      targetCycleLength: number;
    }
  | {
      mode: 'bars';
      beatsPerBar: number;
      numberOfBars: number;
    };

export type CycleFinderOptions = {
  maxDiamondValue: number;
  includeOne: boolean;
  allowReduciblePairs: boolean;
  includeInversePairs: boolean;
  allowFullPathMatches: boolean;
  allowCustomPathMatches: boolean;
  maxResults: number;
  nearMatchTolerance: number;
};

export type CycleMatchKind =
  | 'exact-full-path'
  | 'near-full-path'
  | 'exact-custom-path'
  | 'near-custom-path';

export type CycleFinderResult = {
  kind: CycleMatchKind;
  pairId: string;
  diamondName: string;
  numerator: number;
  denominator: number;
  cycleLength: number;
  targetCycleLength: number;
  difference: number;
  path: CellId[];
  usesFullDiamond: boolean;
  barFits: Array<{
    beatsPerBar: number;
    numberOfBars: number;
  }>;
  explanation: string;
};
```

## Suggested Functions

```ts
export function getTargetCycleLength(input: CycleFinderInput): number;

export function getFullDiamondCycleLength(pattern: DiamondPattern): number;

export function findCycleMatches(
  input: CycleFinderInput,
  options: CycleFinderOptions
): CycleFinderResult[];

export function findSubsetPathsForTarget(
  pattern: DiamondPattern,
  targetCycleLength: number
): CellId[][];

export function getBarFits(
  cycleLength: number,
  candidateBeatsPerBar?: number[]
): Array<{ beatsPerBar: number; numberOfBars: number }>;
```

## Default Options

Suggested defaults:

```ts
{
  maxDiamondValue: 15,
  includeOne: true,
  allowReduciblePairs: true,
  includeInversePairs: true,
  allowFullPathMatches: true,
  allowCustomPathMatches: true,
  maxResults: 12,
  nearMatchTolerance: 4,
}
```

## Future UI Notes

The UI should let the user choose between direct cycle length and bar structure entry.

Results should show:

- Diamond name or pair.
- Match kind.
- Cycle length in beats.
- Target length in beats.
- Difference from target.
- Suggested path.
- Whether the full diamond is used.
- Useful bar fits.
- A short explanation.

Use compact language such as:

```text
Exact full path: 8/2 gives 24 beats.
Near full path: 10/9 gives 84 beats, 4 over target.
Custom path: 5/3 can make 16 beats with top, centre, upperRight, middleRight.
```

## Scope Boundaries

Do not implement these in the Cycle Finder pass unless explicitly requested:

- Audio changes.
- Scheduler changes.
- Tempo model changes.
- Randomiser changes.
- Diamond library rewrites.
- Backend or cloud search.
- Time signature generation claims.
- Thousands of path permutations.
