# Diamond Metronome Project Index

Future Codex sessions should read this index first, then read the engineering handoff and any task-specific documents before changing the app.

Diamond Metronome is a local-first Vite, React and TypeScript MVP. This documentation defines the intended product, rhythm model, architecture, design direction, implementation sequence and scope boundaries.

## Documents

- [01_PRODUCT_BRIEF.md](01_PRODUCT_BRIEF.md) - product purpose, MVP scope, users, out-of-scope features and attribution boundary.
- [02_RHYTHM_MODEL.md](02_RHYTHM_MODEL.md) - timing model, sound priority, default diamond, path behavior and rhythm engine rules.
- [03_UI_SPEC.md](03_UI_SPEC.md) - required screen layout, controls, interaction rules and accessibility basics.
- [04_TECH_SPEC_LOCAL_VITE.md](04_TECH_SPEC_LOCAL_VITE.md) - local Vite architecture, recommended folders, pure engine boundary, Web Audio direction and browser-storage boundaries.
- [05_ACCEPTANCE_CRITERIA.md](05_ACCEPTANCE_CRITERIA.md) - checks for product, rhythm, audio, visual, interaction, library, accessibility and build readiness.
- [06_IMPLEMENTATION_PLAN.md](06_IMPLEMENTATION_PLAN.md) - small local-first build phases and verification expectations.
- [07_CODEX_WORKFLOW.md](07_CODEX_WORKFLOW.md) - required workflow for future Codex sessions.
- [08_SOUND_ASSET_GUIDE.md](08_SOUND_ASSET_GUIDE.md) - expected sound files, recording requirements and sound role guidance.
- [09_ENGINEERING_HANDOFF.md](09_ENGINEERING_HANDOFF.md) - compact summary of non-negotiables, boundaries and next engineering priorities.
- [10_RANDOMISER_AND_DIAMOND_LIBRARY_ADDENDUM.md](10_RANDOMISER_AND_DIAMOND_LIBRARY_ADDENDUM.md) - complete ordered pair library rules and true randomiser requirements.
- [11_VISUAL_DESIGN_AND_SKINNING_ADDENDUM.md](11_VISUAL_DESIGN_AND_SKINNING_ADDENDUM.md) - hand-drawn notebook design direction, skinning layer and copyright boundary.
- [12_CYCLE_FINDER_ADDENDUM.md](12_CYCLE_FINDER_ADDENDUM.md) - future Cycle Finder / diamond recommendation feature for cycle length and bar-fit queries.
- [NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md) - current implementation status, known manual checks and next recommended tasks.

## Scope Reminder

Do not add Supabase, auth, a database, server actions, API routes, MIDI, VST or AU support, DAW sync, cloud saving, notation editing, sample upload, community sharing, mobile-native packaging or Vercel configuration unless explicitly requested later.

Do not convert the project to Next.js.
