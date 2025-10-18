## Frontend Implementation Plan: 3D Bioprinting Slicing Software

Version: 1.0  
Date: 22 September 2025  
Author: Senior Frontend (UI/UX) Engineer

This plan operationalizes `requirements.md` into a concrete, step-by-step execution guide. It emphasizes an Apple/iOS-inspired dark UI, consistency, maintainability, scalability, and efficiency.

---

### 1. Guiding Principles

- **Design language**: iOS/macOS—calm dark surfaces, high contrast, focus rings, motion used sparingly, humane micro-interactions.
- **Architecture**: Modular, strongly typed, Redux Toolkit for state, feature-first structure, domain-driven boundaries.
- **Quality**: Type safety, linting, formatting, tests, accessibility (WCAG 2.1 AA), performance budgets.

---

### 2. Tooling & Project Setup

1) Keep existing React app under `BI-Wombat/src/3d-bioprinting-slicer`, migrate to TypeScript incrementally.
2) Install core dependencies:
   - React 18+, TypeScript, React Router, Redux Toolkit + React-Redux
   - MUI v5 + Emotion, Axios, React Three Fiber (R3F) + Drei
   - ESLint + Prettier + Jest + React Testing Library
3) Configure scripts and linters:
   - ESLint: airbnb-style with TypeScript rules; import sorting; React hooks.
   - Prettier for formatting; ensure editorconfig alignment.
   - Jest + RTL testing config; `setupTests.ts` for custom matchers.
4) TS migration plan:
   - Add `tsconfig.json` with strict flags.
   - Allow JS interop initially (`allowJs: true`) then tighten.
   - Convert files by feature as we implement (see Section 7).

---

### 3. Repository and Folder Structure

Adopt a feature-first structure inside `3d-bioprinting-slicer/src`:

```
src/
  app/
    store.ts
    hooks.ts
    routes.tsx
    theme/
      index.ts
      palette.ts
      typography.ts
      shadows.ts
      components.ts  // MUI component-level overrides
  features/
    model/
      components/
        ModelUploader.tsx
        ModelPreview3D.tsx
      slice/
        modelSlice.ts
      services/
        modelApi.ts
      tests/
    slicing/
      slice/
        slicingSlice.ts
      services/
        slicingApi.ts
      components/
        SlicingControls.tsx
    layout/
      slice/
        layoutSlice.ts
      components/
        BayConfigurationView.tsx
        BayCell.tsx
        ContainerSelector.tsx
      services/
        layoutSelectors.ts
    script/
      slice/
        scriptSlice.ts
      components/
        JobScriptGenerator.tsx
        JobScriptViewer.tsx
      services/
        scriptApi.ts
  ui/
    components/
      MainLayout.tsx
      LeftNavbar.tsx
      Workspace.tsx
      ConfigurationPanel.tsx
      TopBar.tsx
    icons/
    hooks/
  shared/
    components/
      EmptyState.tsx
      ErrorBoundary.tsx
      LoadingOverlay.tsx
      ConfirmDialog.tsx
      FocusRing.tsx
    utils/
      http.ts
      types.ts
      format.ts
    constants/
      containers.ts
      keys.ts
  index.tsx
  App.tsx
```

---

### 4. Theming, Design System, and Accessibility

1) MUI Theme (dark by default):
   - **Color tokens** (aligned with current UI):
     - Surfaces: base `#121212`, raised `#171717`, elevated `#1E1E1E`
     - Accents: Primary `#8B5CF6` (purple), Secondary `#00d4ff`
     - Borders/Dividers: `#374151`
     - Text: Primary `#E5E7EB`, Secondary `#D1D5DB`, Disabled `#9CA3AF`
     - States: Success `#30d158`, Warning `#ffd60a`, Error `#ff453a`
   - **Shadows/elevation**: subtle, blur > spread, never harsh.
   - **Focus ring**: 2px `primary.main` with `alpha(primary, .4)`, rounded corners.
2) Typography: SF Pro Text metrics, fallback Inter/System UI.
   - h1 28/34, h2 22/28, h3 18/24, body1 14/20, caption 12/16.
3) Spacing scale: 4pt grid (4,8,12,16,24,32,48,64).
4) Components overrides:
   - Buttons, Inputs, Selects, Tabs to match iOS minimalism.
   - Cards/Papers with soft borders and low-contrast dividers.
5) Accessibility:
   - Color contrast AA for text against dark backgrounds.
   - Keyboard-first flows: tabbable `BayCell`, visible focus.
   - ARIA roles for grid: `role="grid"`, cells `role="gridcell"`, `aria-selected` on selection.
   - Reduce motion preference respected for animations.

---

### 5. State Management (Redux Toolkit)

Create slices per `requirements.md`:

- `modelSlice`
  - state: `modelData`, `compartments`, `status`
  - actions: `uploadModelRequested`, `uploadModelSucceeded`, `uploadModelFailed`, `clearModel`
- `slicingSlice`
  - state: `layerHeight`, `slices`, `status`
  - actions: `setLayerHeight`, `sliceRequested`, `sliceSucceeded`, `sliceFailed`, `clearSlices`
- `layoutSlice`
  - state: `containerType`, `bays`
  - actions: `setContainerType`, `selectBay`, `assignBayModel`, `setBayMetadata`, `clearBay`
- `uiSlice`
  - state: `activeView`, `selectedBayId`, `notifications`
  - actions: `setActiveView`, `setSelectedBay`, `pushNotification`, `dismissNotification`
- `scriptSlice`
  - state: `status`, `script`
  - actions: `generateRequested`, `generateSucceeded`, `generateFailed`, `clearScript`

Selectors for memoization: `selectBayById`, `selectConfiguredBays`, `selectIsSliceReady`, etc.

---

### 6. API Layer

- Use Axios instance in `shared/utils/http.ts` with interceptors for errors.
- Endpoints per requirements:
  - `POST /api/slice` — body `{ modelData, layerHeight }` → returns `{ slices, compartments }`
  - `POST /api/generate-script` — body `{ layout }` → returns `{ script }`
- Implement async thunks in respective slices. Centralize URL base via env.
- Graceful error handling to `uiSlice.notifications`.

---

### 7. Component Implementation Plan

1) Shell & Navigation
   - `MainLayout.tsx` (three columns): Left nav, Workspace, Config panel.
   - `LeftNavbar.tsx`: Icons for Import, Layout, Generate. Tooltip labels. Active state with focus ring.
   - `TopBar.tsx`: App name, breadcrumb, quick actions (undo/redo placeholders).

2) Epic 1: Model Import & Slicing (Right Panel–Driven Flow)
   - `ModelUploader.tsx` (right panel): Import button; after selection show file name and size.
   - Fields below: Height, Width, Depth, Ink, Print Head, Slice Height.
   - `SlicingControls.tsx`: Start Slicing button at panel bottom with loading state.
   - Center: `ModelPreview3D.tsx` until slicing starts; then switch to a grid of slice thumbnails.
   - Right panel shows Continue/Cancel after slicing.

3) Epic 2: Job Layout (aligns with client screenshot)
   - `ContainerSelector.tsx`: 6/24/96 well, 3×3 custom; updates `layoutSlice.containerType`.
   - `BayConfigurationView.tsx`:
     - Responsive grid container with inset dotted border (as in image).
     - `role="grid"`, keyboard nav with arrow keys.
   - `BayCell.tsx`:
     - Visual states: default, hover, selected (purple outline), configured (subtle badge).
     - Click/Enter selects; Space toggles selection. Shows bay index.
   - `ConfigurationPanel.tsx` (context-aware):
     - When bay selected: module dropdown, type (e.g., 96-well), metadata inputs (Ink Type, Print Head ID), assign model selector.

4) Epic 3: Job Script & Dashboard
   - `JobScriptGenerator.tsx`: Validates layout completeness and triggers generate thunk.
   - `JobScriptViewer.tsx`: Modal with code viewer (monospace, copy, download JSON).
   - Dashboard view: Center shows cards for each model/job with specs (file name/size, dims, ink, head, slice height, selected bay). Clicking a card shows job sequence in the left panel; right panel offers Upload New Model or Print.

5) Shared UX
   - `LoadingOverlay`, `ErrorBoundary`, `ConfirmDialog`, `FocusRing`.
   - Toast notifications for success/failure.

---

### 8. Routing and Views

- Routes in `app/routes.tsx`:
  - `/import` → Model Import & Slice (3D preview or slices grid + right panel flow)
  - `/layout` → Bay Configuration
  - `/script` → Script Generation and Dashboard
- Redirect `/` → `/import` on first load.

---

### 8.1. Detailed User Flow (Import ➜ Slicing ➜ Bay ➜ Dashboard)

Import Panel
1) User taps Import Model → selects file; show file name and size under the button.
2) User enters Height/Width/Depth, selects Ink and Print Head, and sets Slice Height.
3) User presses Start Slicing → right panel shows loading; center switches from 3D preview to slices grid.
4) Right panel shows Continue/Cancel to move forward or back.

Bay Selection
1) Center shows 3×3 grid; user selects a bay; Save/Cancel in right panel.

Dashboard & Script
1) Center shows job cards with specs and selected bay.
2) Selecting a card reveals job sequence in left panel; right panel offers Upload New Model or Print.

Notes
- Persist bay-specific selections in `layoutSlice.bays[bayId]` (module, type, material, assigned model).
- The generate action in Bay View should scope to the active bay but can reuse the global slicing pipeline; expose bay context in the request.
- Status/notifications routed via `uiSlice.notifications` and a non-blocking toast/snackbar.

---

### 9. Visual/Interaction Specs for Bay Grid

- Grid container: 3×3 default; gap 16px; padding 24px; dotted boundary `#2a2c35`.
- Cells: 1:1 aspect, min 140px; background `#17181b`; border `1px solid #2a2c35`; radius 12px.
- Selected cell: `outline: 2px solid #7c4dff`, inner glow `0 0 0 4px rgba(124,77,255,.2)`.
- Hover: elevate by +1 shadow, border lighten.
- Focus: same as selected outline; respects keyboard.
- Number label: text `#B9C0CE`, center; configured badge at top-right.

---

### 10. Performance & Reliability

- Code-split 3D preview route; lazy-load R3F/Drei.
- Memoize heavy components; use `react-window` if slice thumbnails are long.
- Avoid unnecessary re-renders via `useAppSelector` + shallow equality and selectors.
- Web Worker (phase 2) for pre-processing large models if needed.

---

### 11. Testing Strategy

- Unit tests: slices, selectors, reducers.
- Component tests: `BayCell` states, keyboard navigation, uploader validation.
- Integration tests: end-to-end flows per epics with RTL.
- Visual regression (optional): Storybook + Chromatic in phase 2.

---

### 12. CI/CD and Quality Gates

- GitHub Actions (or preferred CI):
  - Install, type-check, lint, test.
  - Build on main; preview builds on PRs.
- Enforce PR standards: coverage thresholds, lint clean, no type errors.

---

### 13. Security & Privacy

- Validate file inputs; restrict size/type; sanitize filenames.
- Use `Content-Security-Policy` headers where hosting allows.
- Avoid storing large model blobs in Redux; keep references/URLs.

---

### 14. Implementation Milestones (2–3 week cadence)

1) Week 1: Foundation
   - Tooling, theme, store, routing, layout shell, LeftNavbar.
2) Week 2: Epic 1
   - Uploader, 3D preview, slicing controls, API integration.
3) Week 3: Epic 2
   - Grid view, cells, container selector, configuration panel wiring.
4) Week 4: Epic 3 + Polish
   - Script generate/viewer, notifications, a11y review, performance pass.

---

### 15. Acceptance Criteria (per Epic)

- Epic 1: Import & Slice
  - Import button shows file name/size; can set dims/ink/print head/slice height; Start Slicing shows loading; center flips to slices grid; Continue/Cancel present.
- Epic 2: Layout
  - User can switch container types; 3×3 grid behaves like screenshot; selection is keyboard and mouse accessible; per-bay metadata saved; configured bays visually marked.
- Epic 3: Script & Dashboard
  - Generate validates inputs; API call succeeds; script is viewable and downloadable; dashboard lists jobs with specs and selected bay; print flow accessible.

---

### 16. Risks & Mitigations

- Large model performance → lazy-load, memoization, potential worker offloading.
- API instability → typed clients, defensive parsing, robust error UX.
- TS migration friction → incremental conversion with `allowJs` off after stabilization.

---

### 17. Definition of Done

- Type-checks pass, 0 ESLint errors, tests ≥80% coverage on slices/components, a11y audit passes key screens, performance budget respected, UX matches theme and reference image.




