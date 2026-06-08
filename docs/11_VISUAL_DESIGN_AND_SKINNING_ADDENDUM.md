# Visual Design And Skinning Addendum

Diamond Metronome should be easy to reskin. Separate rhythm logic, audio scheduling, component structure and visual skin.

## Design Direction

The app should feel like:

- A living rhythm diagram
- A marked-up notebook
- A body-percussion teaching page
- A hand-drawn practice tool

It should not feel like:

- A corporate metronome
- A DAW transport panel
- A drum machine interface
- A scientific graphing tool
- A SaaS dashboard

Visual reference direction:

- Biro diagrams
- Handwritten rhythmic annotations
- Photocopied teaching sheets
- Paper texture
- Uneven but intentional lines
- Hand-drawn arrows and paths
- Workshop notes rather than polished UI chrome

## Skinning Layer

Use CSS variables as the first skinning layer where possible. Avoid hard-coded colors inside individual components unless necessary.

Suggested variables:

```css
:root {
  --rd-bg: #f4ead6;
  --rd-surface: #fff8e8;
  --rd-ink: #1f1b16;
  --rd-muted-ink: #62584a;
  --rd-line: #2a241c;
  --rd-accent: #c9502d;
  --rd-accent-soft: #f2b29b;
  --rd-stomp: #6b3f24;
  --rd-subdivision: #3f5f66;
  --rd-cell-bg: #fffaf0;
  --rd-cell-active-bg: #ffd9ad;
  --rd-cell-selected-bg: #fff0c2;
  --rd-radius: 18px;
  --rd-line-width: 2px;
}
```

Use these variables throughout the UI where possible.

## Copyright And Attribution Boundary

The design may be inspired by the spirit of handwritten rhythm teaching materials, but must not copy Greg Sheehan's published materials.

Do not use copied scans, copied book pages, copied handwriting, copied diagrams or copyrighted layouts from Greg Sheehan's materials.

The app must remain positioned as an independent rhythm practice tool inspired by diamond-based rhythmic thinking and body-percussion pedagogy.

## Accessibility Requirements

Minimum accessibility:

- Buttons have clear labels.
- Controls are keyboard reachable.
- Focus state is visible.
- Sound toggles identify the sound layer.
- Volume controls are labelled.
- Active cell is available as text.
- Current path is available as text.
- Active state does not rely only on color.
- Selected state does not rely only on color.
- Avoid excessive screen reader announcements on every fast tick.
