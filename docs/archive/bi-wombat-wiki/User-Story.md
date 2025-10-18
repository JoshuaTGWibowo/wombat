## Epic 1: Model Import & Slicing

### US1.1 – Import 3D Models
**As Dr. Emily Carter, I want to import 3D models created in external CAD software, so that I can use my existing research designs for printing without needing to recreate them.**

**Acceptance Criteria:**
- Given the user has a valid `.stl`, `.obj` or `.step` file, when they import the file into the software, then the model should appear in the workspace.  
- Given the user selects an invalid file format, when they try to import it, then the system should show an error message.  

---

### US1.2 – Detect Compartments
**As Dr. Alex Nguyen, I want the software to automatically detect compartments within a model, so that I can assign different inks and printing parameters to each part.**

**Acceptance Criteria:**
- Given a multi-part model is imported, when the system processes the model, then it should identify separate volumes as distinct compartments.  
- Given a single-part model is imported, when the system processes it, then only one compartment should be detected.  

---

### US1.3 – Generate Slices
**As Dr. Sofia Ramirez, I want to convert imported models into a stack of 2D slice images, so that they can be projected layer by layer during printing.**

**Acceptance Criteria:**
- Given a model is loaded, when the user requests slicing, then the system should output a sequence of 2D slice images in .bmp format (supporting both 1-bit and 8-bit)..  
- Given a model is sliced, when the output is saved, then the images must be ordered correctly and usable in a job script.  
---

### US1.4 – Adjust Layer Height
**As Dr. Sofia Ramirez, I want to adjust the slicing layer height, so that I can balance between print resolution and printing speed depending on my experiment’s needs.**

**Acceptance Criteria:**
- Given a model is loaded, when the user sets a custom layer height, then the system should generate slices at that resolution.  
- Given the user enters an invalid layer height (e.g., 0 or negative), when slicing is attempted, then the system should show an error and prevent slicing.  
- Given a model is sliced, then the layer height should be consistent across all slices.

---

### US1.5 – Preview Imported Models
**As Dr. Emily Carter, I want to validate that the imported 3D model matches my intended design, so that I can ensure accuracy before committing to slicing.**

**Acceptance Criteria:**
- Given a model is imported, when the user opens the preview, then the 3D model should be displayed correctly.  
- Given a model is imported, when the user rotates , scales or zooms the preview, then the view should update accordingly.  

---

## Epic 2: Job Layout

### US2.1 – Select Container Type & Regions
**As Hannah O’Neill, I want to want to select the correct container type, so that I can match the software setup to the actual well plate or container I am using.**

**Acceptance Criteria:**
- Given no container is set, when the user selects a container type from the list of supported standards(e.g., a 6-well, 12-well, 24-well, 48-well, or 96-well plate), then the workspace should update to reflect the chosen container.
- Given a container is selected, when the user adds regions, then those regions should appear in the layout according to the container’s predefined specifications.
---

### US2.2 – Place Models in Container
**As Dr. Emily Carter, I want to place one or multiple models into the defined container regions, so that I can prepare all the parts of my experiment for printing at once.**

**Acceptance Criteria:**
- Given a sliced model exists, when the user assigns it to a container region, then the region should show the model placement.  
- Given multiple models exist, when the user assigns them to different regions, then all placements should be displayed without overlap errors.  

---

### US2.3 – Assign Metadata
**As Dr. Alex Nguyen, I want to assign metadata such as ink type and print head ID to each region, so that I can differentiate between materials and devices in the job setup.**

**Acceptance Criteria:**
- Given a model is placed in a container region, when the user assigns an ink type and print head ID, then the metadata should be saved with that region.  
- Given no metadata is assigned, when the job script is generated, then the system should show a warning.  

---

### US2.4 – Verify Placement Layout
**As Hannah O’Neill, I want to verify the placement of models within the container, so that I can avoid mistakes before starting a print job.**

**Acceptance Criteria:**
- Given models are placed in a container, when the user opens the layout view, then they should see a clear top-down or 3D view of all placements.  
- Given placements overlap, when the layout is checked, then the system should highlight a warning.  

---

## Epic 3: Job Script Creation

### US3.1 – Generate Job Script
**As Dr. Alex Nguyen, I want to generate a structured job script from the sliced images and layout, so that the printer can execute the job reliably.**

**Acceptance Criteria:**
- Given sliced images and layout exist, when the user generates a job script, then the script should include all required steps (move, expose, print).  
- Given incomplete data, when script generation is attempted, then the system should display an error.  
- Given metadata is assigned in the job setup, when the job script is generated, then the metadata should appear in the script.  
- Given macros are available, when generating the script, then the system should use the defined macros to ensure valid printer instructions.

---

### US3.2 – Display Human-Readable Sequence
**As Dr. Alex Nguyen, I want to clearly understand and review the job sequence in a structured human-readable format, so that I can validate and debug the setup before execution.**

**Acceptance Criteria:**
- Given a job sequence exists, when the user opens the sequence view, then it should be displayed in a structured readable text or JSON format.
- Given the user reviews the sequence, when errors are found, then they should be able to identify which step caused the error.
- Given the sequence is validated, when generating the job script, then there should be a one-to-one correspondence between sequence steps and script instructions.
---

### US3.3 – Export Job Script
**As Hannah O’Neill, I want to preserve the generated job script in a reusable format, so that I can maintain reproducibility and easily share it with colleagues for future experiments.**

**Acceptance Criteria:**
- Given a job script exists, when the user selects export, then the script should be saved as a structured text or JSON file.  
- Given the export is complete, when the file is opened, then it should be readable and structured consistently.  
