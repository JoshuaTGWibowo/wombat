This document provides a comprehensive overview of the **3D Bioprinting Slicing Software** project, a core initiative for a University of Melbourne spinout company. This software is designed to serve as a user-friendly interface, enabling life scientists and biomedical engineers to translate 3D models into precise instructions for a new bioprinting technology.

---

## 1. Project Background

### **1.1. Client & Motivation**

The client is **Michael Halwes**, CEO and co-founder of a new bioprinting technology company. The motivation for this project is to address a critical need in the bioprinting field: the lack of intuitive software that bridges the gap between complex 3D models and the physical bioprinter. By developing a dedicated slicing software, the project aims to simplify the bioprinting workflow, making this advanced technology accessible to non-technical users and accelerating research.

### **1.2. Expected Impact**

The successful delivery of this software will have a significant impact by:
* **Improving Accessibility:** Allowing researchers to prepare their designs without needing expertise in RepRap firmware or complex coding.
* **Enhancing Reproducibility:** Generating reusable job scripts that ensure consistent and repeatable print jobs.
* **Reducing Errors & Waste:** Providing visual previews and validation checks to prevent mistakes before they occur, saving valuable time and expensive materials.
* **Establishing a Foundation:** Creating a robust, foundational software platform that can be expanded with advanced features in future development phases.

---

## 2. Project Scope

This project's scope is focused on delivering a core, functional slicing tool in its initial delivery phase. The deliverables are intentionally structured to be realistic and achievable within the project's timeline.

### **2.1. In-Scope Deliverables**

The project will deliver a web-based application that guides users through three main modules:

#### **Model Import & Slicing**
This module will enable users to prepare their 3D models for printing. Key features include:
* Importing **.stl** and **.obj** 3D models.
* Automatically detecting separate compartments within a model.
* Converting a 3D model into a stack of 2D slice images.
* Allowing users to adjust the slicing layer height.
* Providing both 2D slice and 3D model previews.

#### **Job Layout**
This module focuses on configuring the print job setup, which includes:
* Defining the size and regions of the virtual "container" that represents the print area.
* Placing one or more sliced models into specific container regions.
* Assigning simple metadata like **Ink type** and **Print head ID** to each region.
* Providing a visual layout preview to verify model placement and check for overlaps.

#### **Job Script Creation**
This final module generates the instructions the printer will execute. It will:
* Combine all slice and layout data to generate a structured, human-readable job script (in JSON/text format).
* Ensure the script includes essential instructions, such as move steps and exposure steps.
* Allow users to export the generated job script for reuse and debugging.

### **2.2. Out-of-Scope Items**

To maintain focus and feasibility, the following items are explicitly excluded from this initial phase:
* Advanced slicing features (e.g., infill patterns, support structures).
* Real-time printer status monitoring or live camera feeds.
* Full hardware emulation beyond the basic mock server for testing.
* Deep integration with material properties or chemistry.

---

## 3. Timeline

This project will follow a structured timeline for a phased delivery:

* **Research & Planning:** August 11 – August 22, 2025
* **Development:** August 25 – September 26, 2025
* **Testing & Deployment:** September 29 – October 17, 2025
* **Handover & Recap:** October 20 – October 31, 2025

---

## 4. Team

* Michael Wu
* Joshua Wibowo
* Ji Hoon Hong
* Ali Osman
* Yoshikazu Fujisaka