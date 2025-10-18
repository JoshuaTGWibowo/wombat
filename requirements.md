Of course. Here is a professional frontend requirements document based on the provided information, tailored for a React developer.

***

## **Frontend Technical Requirements: 3D Bioprinting Slicing Software**

**Version:** 1.0  
**Date:** 22 September 2025  
**Author:** Gemini (Senior AI Developer)

This document outlines the technical requirements, architecture, and component breakdown for the frontend of the 3D Bioprinting Slicing Software. The goal is to create a responsive, intuitive, and robust user interface using **React**.

---

### ## 1. Project Overview & Core Technologies

The application will serve as the primary user interface for preparing, configuring, and generating job scripts for a novel bioprinter. It will guide users through model import, slicing, layout configuration, and script generation.

To ensure a modern, scalable, and maintainable codebase, we will use the following technology stack:

* **Framework:** **React 18+** (using functional components and hooks).
* **Language:** **TypeScript** for type safety and improved developer experience.
* **State Management:** **Redux Toolkit** for predictable and centralized state management. This is crucial for handling complex state like model data, slicing parameters, and layout configurations.
* **3D Rendering:** **React Three Fiber (R3F)** and **Drei**. These libraries provide a powerful and declarative way to create and interact with 3D scenes in React, essential for model previews (US1.5).
* **UI Component Library:** **Material-UI (MUI)** to ensure a consistent, accessible, and professional-looking design while accelerating development.
* **API Communication:** **Axios** for handling HTTP requests to the backend server (mock or production).
* **Styling:** **Emotion** or **Styled-components** for component-level styling.

---

### ## 2. Application Architecture & Data Flow

The application will be a Single Page Application (SPA) structured around a central Redux store that acts as the single source of truth.

#### **Redux Store Design**

The store will be divided into logical slices to manage different parts of the application state:

* **`modelSlice`**:
    * `modelData`: Stores the raw data of the imported `.stl` or `.obj` file.
    * `compartments`: An array of detected compartments/meshes within the model (US1.2).
    * `status`: Handles loading, success, or error states for model import.
* **`slicingSlice`**:
    * `layerHeight`: The user-defined height for each slice (US1.4).
    * `slices`: An array of URLs or data for the generated 2D slice images (`.bmp`).
    * `status`: Slicing process status (idle, pending, complete, failed).
* **`layoutSlice`**:
    * `containerType`: The selected well plate type (e.g., '6-well', '96-well') (US2.1).
    * `bays`: An array or object representing the grid configuration (e.g., 9 bays as shown in the image). Each bay object will contain:
        * `id`: The bay number (1-9).
        * `modelId`: The ID of the model placed in it.
        * `metadata`: { `inkType`: string, `printHeadId`: string } (US2.3).
* **`uiSlice`**:
    * `activeView`: Manages the current view in the main canvas ('2D_LAYOUT' or '3D_PREVIEW').
    * `selectedBayId`: The ID of the currently selected bay in the layout view.
    * `notifications`: An array for handling global error messages or warnings.


---

### ## 3. Component Breakdown

The UI can be broken down into the following key React components:

#### **Main Layout Components**

* **`App.tsx`**: The root component, responsible for routing and overall layout.
* **`MainLayout.tsx`**: A primary container component that structures the main interface into three columns: a left navigation bar, the central workspace, and a right configuration panel.
* **`LeftNavbar.tsx`**: A persistent vertical bar with icons for navigating between major sections like **Model Import**, **Job Layout**, and **Job Script**.
* **`Workspace.tsx`**: The central area of the application. It will conditionally render either the `BayConfigurationView` or the `ModelPreview3D` based on the state in `uiSlice`.
* **`ConfigurationPanel.tsx`**: A context-aware panel on the right. Its content will change based on what is selected in the `Workspace`. For instance, when a bay is selected, it will show options to assign a model and metadata (US2.3), as seen in the reference image.

#### **Feature Components**

* **`ModelUploader.tsx`**: A dedicated component for file drag-and-drop or selection. It will dispatch actions to update the `modelSlice` upon successful file validation (`.stl`, `.obj`). Handles US1.1.
* **`ModelPreview3D.tsx`**:
    * Uses **React Three Fiber** to render the model stored in `modelSlice`.
    * Implements camera controls (orbit, pan, zoom) via the **Drei** library to satisfy US1.5.
    * Should be able to visually distinguish different compartments if the data is available.
* **`BayConfigurationView.tsx`**:
    * Renders a grid of `BayCell` components based on the `containerType` in `layoutSlice`. The reference image shows a 9-cell (3x3) layout for "Bay 1".
    * This component directly addresses the visual layout in the provided screenshot.
    * Handles click events on bays to update `selectedBayId` in the `uiSlice`.
* **`BayCell.tsx`**:
    * A reusable component representing a single cell in the grid (e.g., squares '1' through '9').
    * Visually indicates its state: empty, selected, or filled (with a model assigned). The purple outline in the reference image indicates the "selected" state.
* **`JobScriptGenerator.tsx`**:
    * A button or form that, when triggered, dispatches a thunk action to collect all relevant data from the `modelSlice`, `slicingSlice`, and `layoutSlice`.
    * This action will make an API call to the backend to generate the final job script (US3.1).
* **`JobScriptViewer.tsx`**: A modal or view that displays the generated human-readable JSON/text script for review and export (US3.2, US3.3).

---

### ## 4. User Workflow Implementation

This section maps the user stories to the frontend implementation flow.

1.  **Model Import & Slicing (Epic 1)**
    * User clicks the "Import" icon in `LeftNavbar`.
    * The `ConfigurationPanel` displays the `ModelUploader` component.
    * User uploads a `.stl`/`.obj` file. An action is dispatched, updating `modelSlice`.
    * `Workspace` shows the `ModelPreview3D` component, rendering the new model.
    * The `ConfigurationPanel` now shows slicing options (e.g., a slider for `layerHeight`). User adjusts it, updating `slicingSlice`.
    * User clicks "Slice". A request is sent to the backend slicing endpoint.

2.  **Job Layout (Epic 2)**
    * User navigates to the "Layout" section via `LeftNavbar`.
    * The `Workspace` switches to `BayConfigurationView`.
    * The `ConfigurationPanel` shows options to select a `containerType` (e.g., 96-well plate). This updates `layoutSlice` and re-renders the grid.
    * User clicks on a `BayCell` (e.g., cell '2'). Its border highlights, and `uiSlice.selectedBayId` is set to '2'.
    * The `ConfigurationPanel` updates to show controls for the selected bay: a dropdown to assign an imported/sliced model and input fields for **Ink Type** and **Print Head ID**.
    * User fills this data. An action updates the corresponding bay object in `layoutSlice.bays`. The `BayCell` in the view visually updates to show it's configured.

3.  **Job Script Creation (Epic 3)**
    * User navigates to the "Generate Script" section.
    * `Workspace` may show a summary of the entire job configuration.
    * User clicks a "Generate" button in the `ConfigurationPanel`.
    * The application validates that all required data is present (e.g., no empty but configured bays).
    * A thunk action gathers the state from all slices and sends it to the `/api/generate-script` endpoint.
    * Upon receiving a successful response, the `JobScriptViewer` modal appears, displaying the script. An "Export" button allows the user to download the `.json` file.

---

### ## 4.1 Detailed End-to-End User Flow

This describes the precise step-by-step flow and UI states across panels.

1) Import (Right Panel driven)
   - Top of right panel shows an "Import Model" button.
   - When pressed, user selects a file (.stl/.obj). Beneath the button, display file name and size.
   - Below the file info, present customization fields:
     - Height, Width, Depth
     - Ink (material) selector
     - Print Head selector
     - Slice Height (layer height)
   - A "Start Slicing" button sits at the bottom of the right panel. When pressed:
     - The button shows a loading state until slicing completes.
     - The center 3D preview hides and is replaced by a grid of sliced images (thumbnails) of the imported model.
     - The user can review the images. In the right panel, show "Continue" and "Cancel" buttons.
       - Cancel: returns to the previous state (3D preview, file/config preserved).
       - Continue: proceeds to the Bay selection screen.

2) Bay Selection (Center Grid + Right Panel)
   - Center shows the 3×3 Bay grid.
   - User selects a Bay to assign the sliced model.
   - Right panel shows "Save" and "Cancel" buttons for this step.
     - Save: persists the selected bay and metadata.
     - Cancel: returns to slicing review.

3) Dashboard Overview (Summary)
   - After import, slicing, and bay selection steps are done, the center shows a dashboard-style list of all models/jobs.
   - Each job appears as a card/box with its specifications: file name/size, dimensions, ink, print head, slice height, selected bay.
   - Clicking a job card updates the left panel to display the job sequence that will be sent to the printer for verification.
   - Right panel offers quick actions: "Upload New Model" and a "Print" button to print all configured jobs.

4) Printing
   - When the user presses "Print", the prepared sequence is dispatched to the backend/firmware endpoint (implementation detail TBD), with progress and result surfaced via notifications.

---

### ## 5. API Contracts (Frontend Perspective)

The frontend will expect the following API endpoints from the backend server:

* **`POST /api/slice`**
    * **Request Body:** `{ modelData: <file_blob>, layerHeight: <number> }`
    * **Success Response (200):** `{ slices: [<url_to_bmp1>, <url_to_bmp2>, ...], compartments: [...] }`
* **`POST /api/generate-script`**
    * **Request Body:** `{ layout: <layoutSlice_state> }`
    * **Success Response (200):** `{ script: <json_or_text_blob> }`

---

### ## 6. Recommendations & Best Practices

* **Error Handling:** Implement robust error handling. API call failures should display user-friendly notifications using the `uiSlice`. Input validation (e.g., non-zero layer height) should be handled client-side.
* **Testing:** Use **Jest** and **React Testing Library** to write unit and integration tests for components and Redux logic.
* **Code Quality:** Enforce code quality and consistency with **ESLint** and **Prettier**.
* **Version Control:** Use Git with a clear branching strategy like Git Flow (feature branches, develop, main). 🚀

