This document outlines the agreed scope for the **initial delivery phase** of the 3D Bioprinting Slicing project. The goal is to ensure clarity for both project stakeholders and future contributors.

---

## 1. Model Import & Basic Slicing

The first step of the software will focus on enabling users to bring in existing 3D models and prepare them for printing.

**Features:**

* **Import CAD models** in standard formats such as `.stl` and `.obj`.
* **Detect compartments** (basic volume separation), so distinct parts of a model can be recognized individually.
* **Convert to slices:** transform the 3D model into a stack of 2D slice images (e.g., `.png` or `.bmp`).
* **Adjustable layer height:** allow the user to set the thickness of each slice (e.g., 0.1 mm, 0.2 mm).
* **Preview:** provide both a 3D preview of the overall model and a 2D slice-by-slice preview.

**Why it matters:**

* Scientists and engineers can prepare their designs without learning complex 3D printing software.
* A preview ensures users understand how their design will be printed before committing to a job.

---

## 2. Job Layout (Container & Multi‑Print)

Once slicing is complete, users will be able to set up a “container” that represents the printer’s working area. This allows them to arrange their prints logically.

**Features:**

* **Container representation:** define the available printing space.
* **Placement of models:** add one or multiple sliced models into the container.
* **Container configuration:**

  * Define size and regions.
  * Assign models to specific regions.
  * Tag models with simple metadata such as “Ink type” (placeholder) or print head ID.
* **Visual layout preview:** provide both a top‑down view and a simple 3D preview of how the models are placed.

**Why it matters:**

* Users can test different layouts quickly and see how multiple prints would fit in the available space.
* Metadata fields support proof‑of‑concept workflows without requiring full material science integration.

---

## 3. Job Script Creation

The final step of this phase is to generate a “job script” that represents all the information needed to run the print. This script is a structured text or JSON file.

**Features:**

* **Combine slices and layout:** turn the sliced layers and container layout into a job script.
* **Job script contents include:**

  * **Move steps:** instructions for positioning the print head.
  * **Expose steps:** references to slice images that define each layer.
  * **Print sequences:** execution order for each compartment.
  * **Basic metadata:** container ID, ink type, and related information.
* **Readable format:** show the job script in a human-friendly format inside the software for debugging/demo purposes.
* **Export job script:** allow users to save the script to reuse in future sessions.

**Why it matters:**

* Translates a user’s design into the language the printer (or simulator) understands.
* Ensures repeatability by allowing job scripts to be reused or shared.

**Technical note:** APIs for the job script will align with the GitBook documentation that Callum has shared, ensuring compatibility with downstream systems.

---

## 4. Out of Scope (for this Phase)

The following items are **not** included in this initial phase but may be addressed later:

* Advanced slicing features such as infill patterns, supports, or path planning.
* Full monitoring of printer status or camera feeds.
* Deep integration of material properties or ink chemistry.
* Complete emulation of hardware (beyond a mock for testing).

---
