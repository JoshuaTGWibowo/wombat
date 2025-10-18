# User Stories

Each story is grouped under its epic with explicit references to upstream dependencies. Use these IDs when updating delivery plans or test cases.

## Epic 1 – Model Import & Slicing

| Story ID | Persona | Goal | Value | Dependencies | Acceptance Criteria |
| -------- | ------- | ---- | ----- | ------------ | ------------------ |
| US1.1 | Dr. Emily Carter | Import 3D models created in external CAD tools. | Reuse existing experiment designs. | None. | Valid `.stl`/`.obj`/`.step` files appear in the workspace; invalid files raise an error. |
| US1.2 | Dr. Alex Nguyen | Automatically detect compartments within a model. | Assign different inks/parameters per compartment. | US1.1 | Multi-part models become distinct compartments; single-part models remain singular. |
| US1.3 | Dr. Sofia Ramirez | Convert imported models into ordered 2D slices. | Enable projection-based printing. | US1.1 | Slicing generates ordered `.bmp` images in usable format. |
| US1.4 | Dr. Sofia Ramirez | Adjust slicing layer height. | Balance resolution and speed. | US1.3 | Custom heights produce consistent slices; invalid values are rejected. |
| US1.5 | Dr. Emily Carter | Preview imported models. | Confirm model accuracy before slicing. | US1.1 | 3D preview supports rotate/scale/zoom interactions. |

## Epic 2 – Job Layout

| Story ID | Persona | Goal | Value | Dependencies | Acceptance Criteria |
| -------- | ------- | ---- | ----- | ------------ | ------------------ |
| US2.1 | Hannah O’Neill | Select container type and configure regions. | Match digital setup to physical well plates. | US1.3 | Selecting a supported container updates the workspace and region layout. |
| US2.2 | Dr. Emily Carter | Place models into container regions. | Prepare all experiment parts for printing. | US2.1, US1.3 | Assigned models display in their regions without overlap. |
| US2.3 | Dr. Alex Nguyen | Assign metadata (ink type, print head ID). | Differentiate materials and devices. | US2.2 | Metadata persists with each region and warns when missing at script generation. |
| US2.4 | Hannah O’Neill | Verify placement layout visually. | Prevent mistakes prior to printing. | US2.2 | Layout views highlight placements and warn on overlap. |

## Epic 3 – Job Script Creation

| Story ID | Persona | Goal | Value | Dependencies | Acceptance Criteria |
| -------- | ------- | ---- | ----- | ------------ | ------------------ |
| US3.1 | Dr. Alex Nguyen | Generate structured job script. | Execute printer jobs reliably. | US2.2, US2.3 | Scripts include all required steps and surface errors when data is incomplete. |
| US3.2 | Dr. Alex Nguyen | Display job sequence in human-readable form. | Validate and debug job setup. | US3.1 | Sequence view maps 1:1 with script instructions and highlights problem steps. |
| US3.3 | Hannah O’Neill | Export job script. | Maintain reproducibility and shareability. | US3.1 | Exported files are structured, readable, and consistent. |

## Traceability Map

Use this checklist to confirm alignment across documentation:

- Epics ↔️ Roadmap: [Delivery Roadmap](delivery-roadmap.md)
- Epics ↔️ Progress Logs: [`epic*_progress.md`](../../)
- User Stories ↔️ Requirements: [`requirements.md`](../../requirements.md)
- User Stories ↔️ UI Plans: [`frontend_plan.md`](../../frontend_plan.md)
