# Implementation Plan

Build locally first. Keep changes small, verifiable and scoped.

## Sequence

1. Documentation setup.
2. Core rhythm types and constants.
3. Validation helpers.
4. Pure rhythm engine.
5. Basic UI without audio.
6. Temporary oscillator audio.
7. Placeholder sound asset docs.
8. Web Audio lookahead scheduler.
9. Sound priority helper.
10. Live settings and pattern updates during playback.
11. Visual sync to scheduled audio.
12. Interaction rules during playback.
13. `localStorage` save, load and reset.
14. Diamond library and true randomiser.
15. Visual skinning and design pass.
16. Accessibility pass.
17. Rhythm engine tests.
18. Final local MVP audit.
19. Deployment preparation later.

For now, do not deploy and do not add Vercel configuration.

## Phase Guidance

Each phase should leave the app in a working state.

- Add types before behavior.
- Add validation before accepting saved or user-entered data.
- Keep the rhythm engine pure and testable.
- Build the UI around engine outputs instead of duplicating rhythm logic in components.
- Use Web Audio scheduling for playback timing.
- Keep temporary oscillator sounds until WAV body-percussion sample loading is explicitly requested.
- Add persistence only after pattern validation exists.
- Add the diamond library and randomiser as data/logic modules, not hard-coded UI behavior.

## Testing Expectations

After each meaningful phase:

- Run `npm run build`.
- Run lint/tests if available.
- Manually check the primary interaction touched by the change.
- Report known issues before stacking the next large change.

Once audio scheduling exists, avoid piling up large untested changes. Scheduler bugs can be subtle and should be isolated quickly.
