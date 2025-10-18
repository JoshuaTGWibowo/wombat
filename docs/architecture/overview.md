# Architecture Overview

This document expands on the application internals and supplements the top-level README.

## System Architecture at a Glance

- **Frontend**: Vite + React + TypeScript + Redux Toolkit + Material UI + React Three Fiber
- **Backend**: FastAPI Python service that orchestrates the convex slicer
- **Python Slicer**: `convex_slicer` package leveraging `trimesh`, `numpy`, `scipy`, and `Pillow`
- **3D Graphics**: React Three Fiber + Drei for interactive visualization

## Frontend Structure

The client is organized with a feature-first philosophy that keeps UI, state, and data logic close together.

```text
src/
├── app/                    # Redux store configuration and typed hooks
│   ├── store.ts            # Root store with middleware
│   └── hooks.ts            # Typed Redux hooks
├── features/               # Feature modules (domain-driven)
│   ├── model/              # Model upload & 3D preview
│   ├── slicing/            # Convex slicing & visualization
│   ├── layout/             # Bay configuration & container management
│   └── script/             # Job script generation
├── ui/                     # Shared UI components
│   └── components/         # Layout primitives (LeftNavbar, panels)
└── shared/                 # Cross-cutting concerns
    ├── components/         # Reusable UI widgets
    └── utils/              # Utilities & HTTP client helpers
```

### Redux Store Layout

```ts
interface RootState {
  model: ModelState;       // 3D model data, compartments, dimensions
  slicing: SlicingState;   // Slice data, physics params, visualization state
  layout: LayoutState;     // Bay configuration, container type, metadata
  script: ScriptState;     // Generated scripts, validation status
  ui: UIState;             // Notifications, loading states, view preferences
}
```

Key patterns include:

- Feature slices with typed actions and reducers
- Async thunks for API calls with resilient error handling
- Memoized selectors for derived data
- Middleware for logging, persistence, and cross-feature coordination

### Component Hierarchy

```text
App (Router)
├── LeftNavbar (Navigation)
├── Routes
│   ├── ImportView
│   │   ├── ModelPreview3D (3D scene)
│   │   └── SlicingThumbnails (Grid viewer)
│   ├── LayoutView
│   │   └── BayConfigurationView (3x3 grid)
│   └── ScriptView
│       ├── JobScriptGenerator
│       └── JobScriptViewer
└── Notifications (Global state)
```

### Frontend Performance

- Virtualized slice viewers to support datasets with 1,000+ slices
- LRU slice caching to minimize memory footprint
- Lazy loading of 3D models and textures
- `React.memo` and `useMemo` to prevent unnecessary renders

## Backend & Slicing Pipeline

### FastAPI Service

```python
POST /slice/convex                          # Main slicing endpoint
GET  /slice/convex/parameters/default       # Default physics parameters
POST /slice/convex/parameters/validate      # Parameter validation
POST /script/generate                       # Job script generation
```

### Convex Slicer Integration

- Physics-based slicing with meniscus modeling
- Tunable parameters (surface tension, viscosity, contact angle)
- Multithreaded execution for large meshes
- Streaming-friendly slice generation for low memory pressure

### Data Flow

1. **Model Upload** – STL/OBJ validation and initial 3D preview
2. **Parameter Configuration** – Physics parameters captured and validated
3. **Slicing Request** – FastAPI delegating to the convex slicer and returning Base64 slices
4. **Slice Visualization** – Thumbnail grid and virtualized viewers in the client
5. **Export** – Persisted images and JSON job scripts for reuse

### Synchronization & Resilience

- Optimistic updates for responsive UX
- Error boundaries to isolate rendering failures
- Retry strategies for network interruptions
- Background preloading of slice imagery
