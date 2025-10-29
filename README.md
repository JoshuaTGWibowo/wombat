# 3D Bioprinting Slicer

An application for scientists to import 3D CAD models, convert them into 2D slices, arrange them in a virtual container, and generate machine-readable job scripts for bioprinting experiments.

## At a Glance

- **Import & Slice** industry formats such as `.stl` and `.obj`, detect compartments, and generate high-fidelity slices.
- **Plan Layouts** inside a virtual well plate, assign metadata, and validate placement visually.
- **Export Scripts** that translate validated setups into executable printer instructions.

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
pip install uvicorn
pip install fastapi
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Windows (PowerShell):

```powershell
cd src/3d-bioprinting-slicer/src/convex-slicing
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
pip install python-multipart
pip install uvicorn
pip install fastapi
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
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1wb2xsaXdvZy04Ni5jbGVyay5hY2NvdW50cy5kZXYk" >> .env.local
npm ci
npm run dev
```

Windows (PowerShell):

```powershell
cd src/3d-bioprinting-slicer
Set-Content -Path .env.local -Value "BACKEND_URL=http://localhost:8000`nVITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1wb2xsaXdvZy04Ni5jbGVyay5hY2NvdW50cy5kZXYk"
npm ci
npm run dev
```

When it starts, it will print a local URL (usually `http://localhost:5173`). Click it or paste it into your browser.

If port 5173 is busy, use: `npm run dev -- --port 5174` and open `http://localhost:5174`.

Additionally, ensure your `src/3d-bioprinting-slicer/.env.local` includes:

```
BACKEND_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1wb2xsaXdvZy04Ni5jbGVyay5hY2NvdW50cy5kZXYk
```

### 3) Optional helpers

On Windows you can automate the full stack startup with the included batch helper:

```bat
start-wombat.bat
```

On macOS the `start-wombat-macos.command` script launches the backend, frontend, and opens the browser automatically. You can double-click it from Finder or run it from a terminal:

```bash
./start-wombat-macos.command
```

## Documentation Map

| Topic | Where to Look |
| ----- | ------------- |
| Feature overview & tech stack | [`docs/product/features.md`](docs/product/features.md) |
| Architecture and data flow | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| Delivery roadmap & epic status | [`docs/process/delivery-roadmap.md`](docs/process/delivery-roadmap.md) |
| User stories with dependencies | [`docs/process/user-stories.md`](docs/process/user-stories.md) |
| Legacy research & meeting notes | [`docs/archive/bi-wombat-wiki`](docs/archive/bi-wombat-wiki) |

## Repository Layout (Highlights)

- `src/3d-bioprinting-slicer/` – React + TypeScript frontend
- `src/convex-slicing/` – FastAPI wrapper for the convex slicer
- `docs/` – Organized product, architecture, and delivery documentation
- `requirements.md` – Functional and non-functional requirements
- `frontend_plan.md` – UI/UX design direction and implementation details

For deeper architectural details and delivery plans, follow the documentation map above.
