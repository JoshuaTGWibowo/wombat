# 3D Bioprinting Slicer

An application for scientists and researchers to import 3D CAD models, convert them into 2D slices, preview and arrange them in a virtual container, and generate a machine‑readable job script for bioprinting.

-----

## Key Features

### 1. Model Import & Slicing

  * **Import Standard Formats**: `.stl` and `.obj`.
  * **Compartment Detection**: Identify distinct volumes for different printing parameters.
  * **2D Slice Generation**: Produce stacks of 2D images (`.png` or `.bmp`).
  * **Adjustable Layer Height**: Control slice thickness for resolution vs. speed.
  * **Interactive Preview**: Inspect 3D model and review per‑layer slices.

### 2. Job Layout & Configuration

  * **Virtual Container**: Represent your physical well plate or container.
  * **Multi‑Model Placement**: Arrange one or more sliced models into regions.
  * **Metadata Tagging**: Assign Ink Type, Print Head ID, and other essentials.
  * **Visual Layout Preview**: Top‑down and 3D previews to avoid errors.

### 3. Job Script Creation

  * **Automated Script Generation**: Combine slices and layout into JSON.
  * **Human‑Readable**: View and validate scripts in‑app.
  * **Export & Reuse**: Save images and scripts for repeatable experiments.

-----

## Technology Stack

  * **Frontend**: Vite + React + TypeScript + Redux Toolkit + MUI + React Three Fiber
  * **Backend**: FastAPI (Python) wrapping the convex slicer
  * **Python Slicer**: `convex_slicer` with `trimesh`, `numpy`, `scipy`, `Pillow`
  * **3D Graphics**: React Three Fiber + Drei for 3D model visualization

Repository layout (key parts):

  * `src/3d-bioprinting-slicer/` – Frontend React app
    * `src/features/model` – model upload/preview/state management
    * `src/features/slicing` – convex slicing UI, state, API client, advanced viewers
    * `src/features/layout` – bay configuration and container management
    * `src/features/script` – job script generation and viewing
    * `src/ui/components` – main layout components (LeftNavbar, panels)
    * `src/convex-slicing/` – Python convex slicer + FastAPI server

-----

## Architecture Overview

### Frontend Architecture

The application follows a **feature-first architecture** with clear separation of concerns:

```
src/
├── app/                    # Redux store configuration
│   ├── store.ts           # Root store with middleware
│   └── hooks.ts            # Typed Redux hooks
├── features/              # Feature modules (domain-driven)
│   ├── model/            # Model upload & 3D preview
│   ├── slicing/          # Convex slicing & visualization
│   ├── layout/           # Bay configuration & container management
│   └── script/           # Job script generation
├── ui/                   # Shared UI components
│   └── components/       # Layout components (LeftNavbar, panels)
└── shared/               # Cross-cutting concerns
    ├── components/       # Reusable components
    └── utils/            # Utilities & HTTP client
```

### State Management (Redux Toolkit)

**Store Structure:**
```typescript
interface RootState {
  model: ModelState;      // 3D model data, compartments, dimensions
  slicing: SlicingState;  // Slice data, physics params, visualization state
  layout: LayoutState;   // Bay configuration, container type, metadata
  script: ScriptState;   // Generated scripts, validation status
  ui: UIState;          // Notifications, loading states, view preferences
}
```

**Key Patterns:**
- **Feature slices** with typed actions and reducers
- **Async thunks** for API calls with proper error handling
- **Selectors** for computed state derivation
- **Middleware** for logging and persistence hooks

### Component Architecture

**Design System:**
- **MUI v5** with custom dark theme (iOS-inspired)
- **React Three Fiber** for 3D graphics with performance optimization
- **Accessibility-first** with WCAG 2.1 AA compliance
- **Responsive design** with mobile-first approach

**Component Hierarchy:**
```
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

### Performance Optimizations

**3D Rendering:**
- **Virtualized slice viewers** for large datasets (1000+ slices)
- **Slice caching** with LRU eviction strategy
- **Lazy loading** of 3D models and textures
- **Frame rate optimization** with React.memo and useMemo

**State Management:**
- **Normalized state** for complex data structures
- **Selective subscriptions** to prevent unnecessary re-renders
- **Debounced API calls** for parameter changes
- **Background preloading** of slice images

### Backend Architecture

**FastAPI Server:**
```python
# API endpoints
POST /slice/convex          # Main slicing endpoint
GET  /slice/convex/parameters/default  # Default physics params
POST /slice/convex/parameters/validate  # Parameter validation
POST /script/generate       # Job script generation
```

**Python Slicer Integration:**
- **Convex slicing algorithm** with meniscus modeling
- **Physics-based parameters** (surface tension, viscosity, contact angle)
- **Multi-threaded processing** for large models
- **Memory-efficient** slice generation with streaming

### Data Flow

**Slicing Pipeline:**
1. **Model Upload** → STL/OBJ validation → 3D preview
2. **Parameter Configuration** → Physics params → Validation
3. **Slicing Request** → FastAPI → Python slicer → Base64 images
4. **Slice Visualization** → Thumbnail grid → Virtualized viewer
5. **Export** → Download images → Job script generation

**State Synchronization:**
- **Optimistic updates** for immediate UI feedback
- **Error boundaries** for graceful failure handling
- **Retry mechanisms** for network failures
- **Progress indicators** for long-running operations

### Security & Validation

**Frontend:**
- **Input sanitization** for file uploads and parameters
- **Type safety** with TypeScript strict mode
- **XSS prevention** with proper data handling
- **File type validation** (STL/OBJ only)

**Backend:**
- **File size limits** and processing timeouts
- **Parameter validation** with Pydantic models
- **Error handling** with proper HTTP status codes
- **CORS configuration** for development/production

### Testing Strategy

**Unit Tests:**
- Redux slice reducers and selectors
- Component rendering and user interactions
- Utility functions and API clients

**Integration Tests:**
- End-to-end slicing workflow
- API contract validation
- Cross-browser compatibility

**Performance Tests:**
- Large model handling (100MB+ STL files)
- Slice viewer performance with 1000+ slices
- Memory usage optimization

-----

## Quick Start (beginner friendly)

Follow these steps carefully. You will run the backend (Python) and the frontend (website) at the same time in two terminals/windows.

### 0) Prerequisites (install only once)

  * Python 3.10+ installed
    - macOS: Python is usually installed. If not, install via Homebrew: `brew install python`
    - Windows: Download from `https://www.python.org/downloads/` and check “Add python.exe to PATH” during install
  * Node.js 18+ and npm installed
    - macOS: `brew install node`
    - Windows: Download LTS from `https://nodejs.org`
  * Git installed (optional, only if you need to pull updates)

Tip: To check versions, run: `python3 --version`, `node --version`, `npm --version`.

### 1) Start the Backend (FastAPI)

This prepares the Python environment and starts the server that does the slicing work.

macOS/Linux:

```bash
cd src/3d-bioprinting-slicer/src/convex-slicing
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install python-multipart
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Windows (PowerShell):

```powershell
cd src/3d-bioprinting-slicer/src/convex-slicing
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
pip install python-multipart
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

You should see server logs and “Uvicorn running on http://0.0.0.0:8000”. Leave this terminal running.

Verify backend (optional):

  * Open `http://localhost:8000/slice/convex/parameters/default` in your browser. You should see JSON.
  * Or in a terminal: `curl http://localhost:8000/slice/convex/parameters/default`.

### 2) Start the Frontend (Vite dev server)

Open a new terminal/window (keep the backend running in the first one).

macOS/Linux:

```bash
cd src/3d-bioprinting-slicer
echo "BACKEND_URL=http://localhost:8000" > .env.local
npm ci
npm run dev
```

Windows (PowerShell):

```powershell
cd src/3d-bioprinting-slicer
Set-Content -Path .env.local -Value "BACKEND_URL=http://localhost:8000"
npm ci
npm run dev
```

When it starts, it will print a local URL (usually `http://localhost:5173`). Click it or paste it into your browser.

If port 5173 is busy, use: `npm run dev -- --port 5174` and open `http://localhost:5174`.

### 3) Use the App

  1. Go to the app URL (`http://localhost:5173` by default).
  2. Click Import to upload an `.stl` or `.obj` file.
  3. Set dimensions and layer height.
  4. Press Start Slicing. Slices will appear when ready.
  5. Review slices; you can cancel to go back, or continue to layout and generate a job script.

### Common Problems and Fixes

  * “Connection refused” when pressing Start Slicing
    - The backend is not running. Start it (Step 1) and verify `http://localhost:8000/slice/convex/parameters/default` works.
  * Permission error when activating the virtual environment on Windows
    - Run PowerShell as Administrator and execute: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
  * Port already in use
    - Frontend: run `npm run dev -- --port 5174`
    - Backend: change the port: `uvicorn api:app --reload --host 0.0.0.0 --port 8001` and update `.env.local` to match
  * No images after Start Slicing
    - Check the Network tab for the `/api/slice/convex` request
    - Ensure your model file is valid and not empty; see backend logs for errors

That’s it! Keep both terminals open while using the app. Stop with Ctrl+C in each terminal when done.

-----

## Frontend Overview

  * **Main Routes**: `/import` (model upload & slicing), `/layout` (bay configuration), `/script` (job generation)
  * **Redux State**: `model`, `slicing`, `layout`, `script`, `ui` slices
  * **3D Visualization**: React Three Fiber for model preview and meniscus visualization
  * **Advanced Slicing**: Convex slicing with physics parameters, meniscus modeling, height maps
  * **Slice Viewers**: Both thumbnail grid and virtualized viewers for performance
  * **Layout Management**: 3x3 bay grid with metadata assignment (ink type, print head ID)
  * **Job Scripts**: JSON generation with copy/download functionality

## Backend (FastAPI + Python)

  * Location: `src/3d-bioprinting-slicer/src/convex-slicing/api.py`
  * Wraps the Python slicer in `convex_slicer/` and returns real slices for your uploaded model.

Run server (port 8000):

```bash
source .venv/bin/activate && uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

-----

## Dev Server & Environment

From the repo root:

```bash
cd src/3d-bioprinting-slicer
```

Configure backend URL for the Vite proxy:

```bash
echo "BACKEND_URL=http://localhost:8000" > .env.local
```

Optional direct API base URL (useful for production builds):

  * `VITE_API_BASE_URL` – if set, the frontend will call this base URL directly instead of using the `/api` proxy.

Start the UI (choose a free port if 5173 is busy):

```bash
npm ci && npm run dev -- --port 5174
```

Open `http://localhost:5174/`.

-----

## API Contract (Convex Slicing)

  * `POST /slice/convex`
    * Form data: `modelData` (file), `layerHeight` (number), `physicsParams` (JSON string), `outputFormat` (bmp|png|both)
    * Returns: `{ slices: string[], metadata: {...} }` where `slices` are data URLs (bmp/png)
  * `GET /slice/convex/parameters/default` – Get default physics parameters
  * `POST /slice/convex/parameters/validate` – Validate physics parameters
  * `POST /script/generate` – Generate job script from layout configuration

-----

## Common Issues & Fixes

  * ECONNREFUSED when pressing Start Slicing
    * Cause: No server on `BACKEND_URL`/proxy target.
    * Fix: Start the FastAPI backend on port 8000; verify with `curl http://localhost:8000/slice/convex/parameters/default`.

  * Dev server port busy (5173)
    * Fix: `npm run dev -- --port 5174`.

  * No images after Start Slicing
    * Check Network → POST `/api/slice/convex` status/payload.
    * If using FastAPI: check server logs and confirm `trimesh` can read your STL/OBJ.

-----

## Production Build (UI only)

```bash
cd src/3d-bioprinting-slicer
npm run build
```

Serve `dist/` behind your own reverse proxy; set `VITE_API_BASE_URL` at build‑time or route `/api/*` to your backend.

-----

## Code Style & Quality

### Development Standards

**TypeScript Configuration:**
- **Strict mode** enabled with all safety checks
- **Path mapping** for clean imports (`@/features/*`, `@/shared/*`)
- **ESLint** with TypeScript rules and React hooks
- **Prettier** for consistent code formatting

**Code Organization:**
- **Feature-first structure** with domain boundaries
- **Barrel exports** for clean import statements
- **Custom hooks** for reusable logic
- **Error boundaries** for component isolation

**Performance Guidelines:**
- **React.memo** for expensive components
- **useMemo/useCallback** for derived values and functions
- **Lazy loading** for route-based code splitting
- **Virtualization** for large lists and grids

### Quality Assurance

**Linting & Formatting:**
```bash
npm run lint          # ESLint with TypeScript rules
npm run format        # Prettier formatting
npm run type-check    # TypeScript compilation check
```

**Testing Commands:**
```bash
npm test              # Jest unit tests
npm run test:watch     # Watch mode for development
npm run test:coverage  # Coverage report
```

**Build & Deployment:**
```bash
npm run build         # Production build
npm run preview       # Local preview of build
npm run analyze       # Bundle size analysis
```

### Code Patterns

**Redux Patterns:**
```typescript
// Feature slice with typed actions
const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setModelData: (state, action: PayloadAction<ModelData>) => {
      state.data = action.payload;
    },
  },
});

// Async thunk with error handling
export const uploadModel = createAsyncThunk(
  'model/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await modelApi.upload(file);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

**Component Patterns:**
```typescript
// Custom hook for feature logic
const useModelUpload = () => {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector(selectModelState);
  
  const upload = useCallback((file: File) => {
    dispatch(uploadModel(file));
  }, [dispatch]);
  
  return { data, status, error, upload };
};

// Memoized component with proper typing
const ModelPreview3D = React.memo<ModelPreview3DProps>(({ 
  modelData, 
  onSliceSelect 
}) => {
  // Component implementation
});
```

## Where Things Render

  * `src/App.tsx` – main routing with `/import`, `/layout`, `/script` views
  * `features/slicing/components/` – `ConvexSlicingDashboard`, `ConvexSliceViewer`, `VirtualizedSliceViewer`, `Meniscus3DVisualization`
  * `features/layout/components/` – `BayConfigurationView`, `BayCell`, `ContainerSelector`
  * `features/script/components/` – `JobScriptGenerator`, `JobScriptViewer`
  * `ui/components/` – `LeftNavbar`, `ImportPanel`, `ReviewPanel`, `ConfigurationPanel`

## Data Persistence

  * Slices and metadata live in Redux state only (in memory) until export.
  * Export functionality for slice images and job scripts.
  * Layout configurations persist during session.
  * No database required – all data managed in Redux store.

-----

## Contributing

Please follow our established workflow to ensure a smooth development process.

### Git Workflow

1.  **Create a Feature Branch** from `frontend/main-frame` or your feature branch as appropriate.
    * Naming: `feature/US<story-number>-<short-description>` (e.g., `feature/US1.1-import-3d-models`)
2.  **Make Commits** using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
    * Format: `<type>(<scope>): <subject>` (e.g., `feat(import): Add parser for .stl files (US1.1)`)
3.  **Submit a Pull Request** when the feature is complete.

### Current Implementation Status

  * ✅ **Epic 1**: Model Import & Slicing (Complete)
    * STL/OBJ model upload with validation
    * 3D model preview with React Three Fiber
    * Convex slicing with physics parameters
    * Advanced slice viewers (thumbnail + virtualized)
    * Meniscus 3D visualization
    * Physics parameter validation and real-time preview
    * Export functionality for slice images
  * ✅ **Epic 2**: Job Layout (Complete)
    * 3x3 bay configuration grid with visual feedback
    * Container type selection (6-well, 24-well, 96-well, custom)
    * Metadata assignment (ink type, print head ID)
    * Bay selection and model assignment
    * Visual layout preview with 3D representation
  * ✅ **Epic 3**: Job Script Generation (Complete)
    * JSON script generation with validation
    * Script viewer with syntax highlighting
    * Copy to clipboard and download functionality
    * Layout completeness validation
    * Job metadata integration

### Technical Debt & Future Improvements

**Performance Optimizations:**
- [ ] Web Workers for slice processing
- [ ] Progressive loading for large models
- [ ] GPU acceleration for 3D rendering
- [ ] Service worker for offline capability

**Feature Enhancements:**
- [ ] Multi-model slicing in single job
- [ ] Advanced physics parameter presets
- [ ] Real-time collaboration features
- [ ] Cloud storage integration

**Developer Experience:**
- [ ] Storybook for component documentation
- [ ] E2E testing with Playwright
- [ ] Performance monitoring dashboard
- [ ] Automated deployment pipeline

-----

# Changelog
## [0.2.0] - 29-09-2025
### Added
- Web-Based Slicer Engine: Initial version of the core slicing functionality is now live.
- 3D Model Upload: Users can upload 3D models in .STL and .OBJ format.
- 3D Model View: The users can interact with the imported model in a 3D view.
- Basic Slicing Parameters: Ability to set layer height and print speed.
- 2D Slice Visualisation: Users can view the generated 2D layers of their uploaded model.

## [0.1.0] - 29-08-2025
### Added
- Project Documentation: Initial project README.md created.
- Wiki Setup: Created the project wiki with initial project goals and scope.

-----
