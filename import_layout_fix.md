## Import Right Panel Cleanup, Functional Actions, and Convex-Only Slicing

This document outlines a pragmatic, high-signal plan to:
- Clean up and organize the Import right panel for clarity and speed.
- Make the action buttons fully functional with proper UX and safe state transitions.
- Remove/disable planar slicing; adopt convex slicing as the sole slicing mode.

The plan emphasizes maintainability, scalability, consistency, efficiency, and modularity, while avoiding over-engineering. It targets the files currently in use:
- `src/3d-bioprinting-slicer/src/ui/components/ImportPanel.tsx`
- `src/3d-bioprinting-slicer/src/features/slicing/components/SlicingControls.tsx`
- `src/3d-bioprinting-slicer/src/features/slicing/components/SlicingThumbnails.tsx`
- `src/3d-bioprinting-slicer/src/features/slicing/slice/slicingSlice.ts`
- `src/3d-bioprinting-slicer/src/features/slicing/slice/slicingThunks.ts`
- Convex-only: `src/3d-bioprinting-slicer/src/features/slicing/slice/convexSlicingThunks.ts` and `.../services/convexSlicingApi.ts`
- Routing/container: `src/3d-bioprinting-slicer/src/App.tsx`

---

### Design Principles (Apple/iOS inspired)
- Focus: One primary action per view; secondary actions are supportive and unobtrusive.
- Information hierarchy: Clear group titles, minimal inputs on-screen, progressive disclosure.
- Visual rhythm: Consistent spacing, aligned fields, deliberate use of contrast.
- Safe operations: Undo-friendly flows, cancellable workloads, clear feedback.

---

## Phase 1 — Right Panel Information Architecture

1) Consolidate sections in `ImportPanel.tsx` with clear headings
- Order:
  - Model (Upload)
  - Dimensions (Height, Width, Depth)
  - Material & Head (Ink, Print Head)
  - Slicing (Convex only; simplified controls)
  - Actions (Start / Cancel)

2) Apply consistent spacing and section wrappers
- Use `Stack` with uniform spacing and section `Typography` for titles.
- Keep `Box` wrappers minimal; avoid nested borders. Prefer a single subtle divider between major sections if needed.

3) Progressive disclosure
- Show Slicing controls only when a model is uploaded and dimensions are valid.
- Disable `Start Slicing` until required fields are valid.

4) Surface state and errors inline
- Show small helper/error text under invalid fields (e.g., non-positive dimensions).
- Use `Notifications` only for global events/errors.

Deliverables:
- Updated `ImportPanel.tsx` JSX structure and conditional render states (no logic duplication).

---

## Phase 2 — Convex-Only Slicing

1) Remove or disable Planar slicing affordances
- If `SlicingControls` supports multiple modes, remove the mode selector or set mode to a constant `convex`.
- Delete/unmount planar-specific UI elements if present.

2) Route all slice requests through convex stack
- In `ImportPanel.tsx`, ensure `Start Slicing` dispatches convex-specific thunk.
  - Replace `requestSlice()` with `requestConvexSlice()` (to be created if not present) or refactor `requestSlice` to delegate to convex.
- Ensure thumbnails and viewers read convex slice data sources.

3) Cleanly separate concerns
- Keep a thin façade in `slicingThunks.ts` that forwards to `convexSlicingThunks.ts`.
- Mark planar-related thunks/selectors as deprecated or remove if unused.

Deliverables:
- `convexSlicingThunks.ts` ensured present and exported.
- `slicingThunks.ts` updated to call convex implementations.
- `SlicingControls.tsx` simplified to convex-only configuration inputs (if any).

---

## Phase 3 — Make Actions Functional and Safe

1) Start Slicing
- Preconditions: model present, dimensions valid, material/head set if required.
- Action: dispatch convex slice thunk with current model + parameters.
- UI: disable while pending; show progress/indeterminate state.
- Result: on success, render thumbnails; on error, show inline error and `Notifications`.

2) Cancel
- Implement `cancelConvexSlice()` in thunks to abort in-flight request (AbortController or cancellation token).
- Clear transient slicing state (pending, error, temporary buffers), but preserve uploaded model and user inputs.
- UI: disable cancel when nothing is in-flight.

3) Reset on navigation
- If user navigates away mid-slice, auto-cancel.

Deliverables:
- New cancel thunk, slice state flags, and reducer handlers in `slicingSlice.ts`.
- Wiring in `ImportPanel.tsx` for button enable/disable states and handlers.

---

## Phase 4 — Validation, Accessibility, and Keyboard

1) Inputs validation
- Height/Width/Depth must be positive numbers; clamp or block invalid entries.
- Add helper/error text via MUI `TextField` props.

2) A11y
- Ensure labeled controls: `aria-label` for buttons, descriptive labels for inputs.
- Focus management: after upload, focus first invalid field; on error, move focus to error summary.

3) Keyboard shortcuts (optional, non-invasive)
- Enter: trigger Start if enabled.
- Esc: trigger Cancel if cancellable.

Deliverables:
- Minor updates to `ImportPanel.tsx` fields.

---

## Phase 5 — Performance and State

1) Throttling and caching
- Avoid duplicate slice requests. Debounce rapid parameter changes; require explicit Start.
- Cache last successful convex slice params; show quick feedback if unchanged.

2) Memory lifecycle
- When model changes, invalidate previous slices.

Deliverables:
- Small utilities in `.../services/sliceCache.ts` (already present path in untracked files) and thunk guards.

---

## Phase 6 — UI Polish

1) Visual consistency
- Use system colors already present (e.g., `#171717` panel, `#374151` divider).
- Maintain panel width `340px`, consistent padding.

2) Thumbnails area
- In `App.tsx`, ensure `SlicingThumbnails` only appears if data exists; otherwise show `ModelPreview3D`.
- Add empty state messaging when no slices yet.

Deliverables:
- Conditional renders and small empty state component or inline placeholder.

---

## Phase 7 — Testing and QA

1) Unit tests
- Slice thunks: start/cancel flows, success/error states.
- Slice reducer: flags and state transitions.

2) Integration tests (happy path and cancel)
- Upload model → set dimensions → Start → thumbnails render.
- Start → Cancel before completion → no thumbnails, state reset sans model loss.

3) Accessibility checks
- Axe or similar for basic violations.

Deliverables:
- Tests alongside existing patterns in `features/slicing/tests`.

---

## Concrete Edit Checklist

- ImportPanel
  - Reorganize sections; add conditional disables; wire button states.
  - Replace `requestSlice()` with convex-only thunk.
  - Implement Cancel button: dispatch cancel and clear transient slice state.

- SlicingControls
  - Remove mode selector if present; limit controls to convex parameters.
  - Ensure props/state align with convex APIs.

- Thunks and Slice
  - Add `requestConvexSlice`, `cancelConvexSlice` in `convexSlicingThunks.ts`.
  - Update `slicingSlice.ts` with `pending`, `error`, `cancellable` flags.
  - Ensure selectors expose computed readiness (`canStart`, `canCancel`).

- App routing / viewport
  - In `ImportView`, show thumbnails only when present else 3D preview.

---

## Acceptance Criteria

- Right panel is visually simpler, with clear sections and consistent spacing.
- Start button enables only when inputs are valid; shows progress when running.
- Cancel button cancels in-flight slicing and clears transient state without losing model.
- No planar slicing UI/logic remains; only convex slicing path is reachable.
- Thumbnails appear after successful convex slicing; empty state otherwise.
- Basic unit and integration tests pass.

---

## Implementation Order (Low-Risk to Higher-Risk)

1) Simplify `SlicingControls` to convex-only UI.
2) Wire convex-only thunks and slice state changes.
3) Update `ImportPanel.tsx` handlers and conditional UI.
4) Adjust `App.tsx` rendering of thumbnails/preview.
5) Add cancel support and state cleanup.
6) Add validations, a11y improvements, and tests.
7) Final polish and copy review.

---

## Notes
- Prefer thin general thunks that delegate to convex-specific implementations for future extensibility.
- Keep changes localized; avoid unrelated refactors.
- Reuse existing color tokens and spacing scale for a coherent look-and-feel.
