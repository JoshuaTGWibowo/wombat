## Epic 2 Progress Log: Job Layout (Bay Grid)

Date: 22 September 2025

Scope: Implement the bay configuration UI per the client reference — 3×3 grid with dotted boundary, keyboard/mouse selection, right-side configuration panel, and container selector. Uses dark iOS-style theme from Epic 1.

---

### Checklist

- [x] Create `layoutSlice` and selectors
- [x] Implement `BayConfigurationView` grid container (CSS Grid 3×3, dashed border)
- [x] Create `BayCell` with visual states and focus ring (hover/selected, purple accent)
- [x] Add `ContainerSelector` for plate types
- [x] Implement `ConfigurationPanel` (module, type, metadata, assign model)
- [x] Wire `/layout` route and 2-column shell
- [x] Add ARIA roles and keyboard navigation (arrow keys, Enter/Space)

Updates:

- Import route now matches the three-column layout and places Import above Slicing in the right panel.
- Full-bleed 3D preview fixed between left (64px) and right (340px) panels; removed padding/gutters to eliminate side margins.

---

### Decisions & Conventions

- Grid is driven by Redux state (`layoutSlice`), not local component state, to keep selection/config centralized.
- Keyboard behavior: arrow keys move selection; Enter selects, Space toggles selected; tab order respected.
- Visuals: dotted outer boundary, soft 1px borders, selected outline in `#7c4dff` with inner glow.

---

### Status: Completed

Notes:
- Left nav icons centered; right panel fixed width with header actions (+/x), tidy dark form styling.
- Central grid matches reference interaction and visuals.
 - Next iteration: integrate Epic 1/3 transitions (Continue from slicing → auto-focus first bay; Save returns to dashboard).

