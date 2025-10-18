## Epic 3 Progress Log: Job Script

Date: 22 September 2025

Scope: Validate layout completeness, trigger script generation via backend, and present the resulting JSON/text for review and export.

---

### Checklist

- [x] Create `scriptSlice` and API client
- [x] Implement `JobScriptGenerator` (validate input, dispatch async)
- [x] Implement `JobScriptViewer` modal (view/copy/download)
- [x] Wire `/script` route and navbar entry
- [ ] Surface errors via notifications (in progress)

---

### Decisions & Conventions

- Keep script payloads lean; derive from Redux state (`layout`, `model`, `slicing`).
- Non-blocking UX: show progress/status and allow dismissal.
 - Dashboard view aligns with plan: job cards in center with specs; clicking reveals job sequence on left; right panel provides Upload New Model and Print actions.

---

### Next Up

1. Pipe script generate errors to `ui.notifications` and toast (in progress).
2. Add minimal validation that at least one bay is configured before enabling Generate.

---

### How to run Epic 3 now

1) Go to `/script` from the left navbar.
2) Click Generate to call the backend (`POST /generate-script`).
3) On success, the viewer modal appears with copy and download actions.

