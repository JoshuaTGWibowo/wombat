## Epic 1 Progress Log: Model Import & Slicing

Status: Completed

Date: 22 September 2025

This document tracks step-by-step progress for Epic 1 as outlined in `frontend_plan.md` and `requirements.md`. It follows an Apple/iOS-inspired design philosophy with a focus on maintainability, scalability, consistency, efficiency, and modularity.

---

### Checklist

- [x] Scaffold React + TypeScript app under `src/3d-bioprinting-slicer`
- [x] Install core dependencies: React Router, Redux Toolkit, React-Redux, MUI, Axios, React Three Fiber, Drei
- [ ] Add tooling: ESLint, Prettier, Jest + RTL
 - [x] Establish dark MUI theme and design tokens
 - [x] Create Redux store and base slices (`modelSlice`, `slicingSlice`, `uiSlice`)
 - [x] Wire shell layout and routes for Import flow
- [x] Implement `ModelUploader` with validation and state wiring
- [x] Implement `ModelPreview3D` with basic viewer
- [x] Implement `SlicingControls` and async thunk to `/api/slice`
- [x] Add notifications/toast handling for errors
- [ ] Write unit/component tests for Epic 1 (deferred to Epic 2)

---

### 1) Scaffold App

- Action: Created Vite React + TS app at `src/3d-bioprinting-slicer`.
- Notes: Initial scaffold was misplaced by tooling; relocated into the correct path. Ran `npm install` successfully.

### 2) Install Dependencies

- Installed routing, state, UI, HTTP, and 3D libraries:
  - `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `axios`, `three`, `@react-three/fiber`, `@react-three/drei`.

### Next Up

1. Add basic tests for uploader validation and slice reducer/thunk.
2. Validate end-to-end Import → Slicing grid → Layout transition.

---

### 3) Epic 1 UI Components

- Implemented `ModelUploader` with `.stl/.obj` validation and Redux wiring.
- Implemented `ModelPreview3D` placeholder scene with OrbitControls and grid.
- Implemented `SlicingControls` with layer height slider and slice trigger.
- Added global `Notifications` component wired to `uiSlice`.

### 4) API & Async

- Created Axios client `shared/utils/http.ts` with base URL and error interceptor.
- Implemented `features/slicing/services/slicingApi.ts` for `POST /slice` using `FormData`.
- Added thunk `requestSlice` to dispatch request/complete/fail based on API result.

Note: Backend team will own the slicing mechanism. The current frontend thunk and API service will remain in place (not removed) and can be pointed to the backend via environment config. No further frontend-side slicing logic changes planned until backend contracts are finalized.

### How to run Epic 1 now

1) Start dev server:
   - `cd src/3d-bioprinting-slicer && npm run dev`
2) Navigate to `/import` (default). Upload `.stl`/`.obj`, adjust layer height, and click Slice.
3) Observe notifications on error; success stores `slices` in state (UI for thumbnails is phase 2).

UI/Layout alignment

- Import view now matches the app’s three-column shell: fixed left nav, full-bleed center 3D preview, fixed right Import/Slicing panel. The uploader lives in the right panel above layer controls.

Environment

- Configure API base: create `.env.local` in `src/3d-bioprinting-slicer` with `VITE_API_BASE_URL="http://localhost:PORT/api"` when backend is ready. Frontend will send `POST {base}/slice`.

---

### Deferred to Epic 2

- Automated tests (uploader validation, slice reducer/thunk, component render states)
- Slice thumbnails list and viewer UI
- Real geometry loading in 3D preview

---

### Decisions & Conventions

- Feature-first structure under `src/3d-bioprinting-slicer/src` will mirror the plan when creating features.
- Strict TypeScript with incremental tightening (allowJs off by default since template is TS-only).
- Global Axios instance with interceptors for error handling.

---

### Risks & Mitigations (Epic 1 scope)

- Large model files: lazy-load 3D viewer, memoize, and consider workers if needed.
- API instability: type response contracts, surface errors via toasts and `uiSlice`.


