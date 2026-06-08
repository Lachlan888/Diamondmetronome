# Storage Module

Diamond Metronome stores one editable pattern in `localStorage`.

Storage key:

```text
diamond-metronome:saved-pattern
```

Current responsibilities:

- Save one custom `DiamondPattern`
- Load saved pattern data safely
- Validate saved data before using it
- Avoid crashing when saved data is missing, stale or invalid

Not implemented yet:

- Multiple saved patterns
- Import/export
- Cloud persistence
