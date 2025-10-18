## **Who (Stakeholders)**  
_List the primary stakeholders interacting with your system (e.g., users, administrators, developers)._  
- Users - Life Scientists (Scientists, Lab Technicians)
- Cymphony Bio - CEO Michael Halwes, CTO Callum Vidler, Kriss Developer
- Student Dev Team - BI-Wombat

## **DO (Functional Goals)**  
_What should the system accomplish? Identify key features and functionality._
- Execute a printing job.
- Simulate print to catch errors.
- Import 3D models.
- Convert 3D models to stacked 2D slices (PNG/BMP).
- Live previews (2D & 3D).
- Define size of the print container & region for placement. 
- Be able to place multiple models in one job. 
- Assign placeholder metadata (Ink type, Print Head ID).
- Generate a mock Job Script in JSON/text format.
- Export the job script for reuse. 

## **BE (Quality Goals)**  
_How should the system behave? Identify key quality attributes._  
- User-Friendly: The software's interface should be intuitive and appropriate for life scientists, who often have limited to no experience with 3D printing. It should be usable "out of the box" without a steep learning curve.  
- Reliable: The system should be robust to prevent errors like hardware crashes. It should include features like print simulation to validate operations before execution and generate logs for monitoring and debugging.
- Efficient: The software needs to be responsive and computationally efficient to support the user's overall experience.
- Interoperable: The software should seamlessly communicate with all hardware components like the motion controller, light engine, and Raspberry Pi.

## **FEEL (Emotional Goals - OPTIONAL)**  
_How should stakeholders feel when interacting with the system?_  
- Confident: Users should feel confident when using the system since they are likely to have little to no experience with 3D printing software. Features like print simulation are intended to reassure them that they can run a job without causing hardware crashes. They should feel in control of a powerful tool without needing to be an expert. 
- Supported: Scientists should feel that the system is designed specifically for their needs. The user interface and workflow should anticipate the requirements of a life sciences environment. They should feel that the tool is actively helping their research rather than creating a technical barrier. 
- Engaged: Users should feel engaged with the printing process. Interactive features like toggling between 2D and 3D views of the print bed setup, previewing the sliced model, and monitoring the live camera feed will provide a more interesting and informative experience.

## **Motivational Model**  
<img width="831" height="416" alt="biwombat_motivational_model" src="https://github.com/user-attachments/assets/2b97355e-0815-41ba-a5b5-a53d417ee325" />
