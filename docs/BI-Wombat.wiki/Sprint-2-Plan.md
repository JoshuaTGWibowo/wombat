# Sprint 2 Goal
By the end of Sprint 2, a user will be able to import a 3D model (.stl or .obj), adjust the slicing parameters, and successfully generate a valid, ordered stack of 2D slice images.

This goal focuses on delivering the entire "Prepare Model" workflow, which is the foundational engine of the entire application.

### Prioritized Stories & Dependencies for Sprint 2
The following user stories have been selected for Sprint 2. They are prioritized based on their logical dependencies.
<google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}--></style>
Priority | User Story | Description | Dependencies
-- | -- | -- | --
1 | US1.1 – Import 3D Models | Allow users to import .stl and .obj files. | None
2 | US1.5 – Preview Imported Models | Display the imported model in a 3D view. | US1.1
3 | US1.2 – Detect Compartments | Automatically identify separate volumes in the model. | US1.1
4 | US1.4 – Adjust Layer Height | Provide a UI input for the user to set slice thickness. | None (UI element)
5 | US1.3 – Generate Slices | Convert the 3D model into a sequence of 2D images. | US1.1, US1.4

### Dependency Rationale:

* We must be able to import a model (US1.1) before we can do anything else with it.
* Previewing the model (US1.5) is the immediate next step to validate the import was successful.
* Generating slices (US1.3) is the final output of this workflow and depends on having an imported model and a defined layer height (US1.4).

### Next Steps for Sprint 2
1. Backlog Refinement: The Sprint 2 stories listed above will be moved from the main product backlog into the "Sprint 2 Backlog" on our GitHub Project board.
2. Task Breakdown: Each user story will be broken down into smaller, technical tasks by the development team (e.g., "Create file import dialog," "Implement STL parsing library," "Set up 3D viewport widget").
3. Branch Creation: Feature branches will be created for each user story, following our established naming convention (e.g., feature/US1.1-import-3d-models).
4. Begin Development: Work will commence starting with the highest priority story, US1.1 – Import 3D Models.
5. Fortnightly Stand-ups: The team will hold fortnightly stand-up meetings to track progress and address any blockers.