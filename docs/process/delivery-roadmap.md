# Delivery Roadmap

This roadmap groups the major epics, highlights dependencies, and links to detailed progress logs.

| Epic | Goal | Dependencies | Current Status | References |
| ---- | ---- | ------------ | -------------- | ---------- |
| Epic 1 – Model Import & Slicing | Enable researchers to ingest 3D CAD data and convert it into validated 2D slices. | None (foundational). | Completed. | [Epic 1 Progress Log](../../epic1_progress.md) |
| Epic 2 – Job Layout | Arrange sliced models into physical containers with metadata. | Requires slice outputs from Epic 1. | In Progress. | [Epic 2 Progress Log](../../epic2_progress.md) |
| Epic 3 – Job Script Creation | Generate and export machine-readable scripts from the configured layout. | Depends on layout metadata (Epic 2) and slices (Epic 1). | Pending. | [Epic 3 Progress Log](../../epic3_progress.md) |

## Timeline Milestones

1. **Foundation (Epic 1)** – Establish ingestion, slicing, and preview loops.
2. **Experiment Assembly (Epic 2)** – Configure container layouts and metadata, unlocking end-to-end job preparation.
3. **Automation (Epic 3)** – Produce executable job scripts with validation, export, and audit trails.

## Related Documentation

- [User Stories](user-stories.md)
- [Product Feature Overview](../product/features.md)
- [Architecture Overview](../architecture/overview.md)
