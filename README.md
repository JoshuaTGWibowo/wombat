# 3D Bioprinting Slicer

An application for scientists to import 3D CAD models, convert them into 2D slices, arrange them in a virtual container, and generate machine-readable job scripts for bioprinting experiments.

## At a Glance

- **Import & Slice** industry formats such as `.stl` and `.obj`, detect compartments, and generate high-fidelity slices.
- **Plan Layouts** inside a virtual well plate, assign metadata, and validate placement visually.
- **Export Scripts** that translate validated setups into executable printer instructions.

## Getting Started

Run the combined dev stack with the helper script (it installs dependencies as needed):

```bash
./scripts/dev.sh
```

Optionally, configure the frontend API target via `src/3d-bioprinting-slicer/.env.local` before launching:

```
VITE_API_BASE_URL="http://localhost:8000/api"
```

If you prefer to manage services manually, the individual commands are still available:

```bash
# Frontend
cd src/3d-bioprinting-slicer
npm install
npm run dev

# Backend (convex slicer API)
cd src/convex-slicing
pip install -r requirements.txt
uvicorn app.main:app --reload
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
