# Product Feature Overview

## Core Capabilities

### Model Import & Slicing
- Import industry standard formats (`.stl`, `.obj`).
- Detect distinct compartments to support multi-material prints.
- Generate stacks of `.png` or `.bmp` slice images.
- Configure adjustable layer heights for resolution/speed trade-offs.
- Preview imported models with interactive controls.

### Job Layout & Configuration
- Represent the target well plate or container as a virtual workspace.
- Place one or more sliced models across regions.
- Tag regions with ink type, print head ID, and other metadata.
- Visualize placements in top-down and 3D views with validation warnings.

### Job Script Creation
- Automatically merge slices and layout metadata into a JSON job script.
- Provide human-readable previews for review and validation.
- Export artifacts for reproducible and shareable experiments.

## Technology Stack

| Layer            | Technologies |
| ---------------- | ------------ |
| Frontend         | Vite, React, TypeScript, Redux Toolkit, Material UI, React Three Fiber |
| Backend          | FastAPI (Python) |
| Slicer Pipeline  | `convex_slicer`, `trimesh`, `numpy`, `scipy`, `Pillow` |
| 3D Visualization | React Three Fiber, Drei |

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Delivery Roadmap](../process/delivery-roadmap.md)
- [User Stories](../process/user-stories.md)
