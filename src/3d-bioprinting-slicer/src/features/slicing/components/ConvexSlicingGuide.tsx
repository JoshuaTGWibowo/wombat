import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  IconButton,
  Divider,
  Alert,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  Science as ScienceIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

interface ConvexSlicingGuideProps {
  open: boolean;
  onClose: () => void;
}

const guideSteps = [
  {
    label: 'Getting Started',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Welcome to Convex Slicing
        </Typography>
        <Typography variant="body2" paragraph>
          Convex slicing uses advanced physics modeling to create more accurate 3D bioprinting slices.
          It accounts for the meniscus formation that occurs when printing with liquid materials.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Key Benefits:</strong> More accurate printing, better material utilization,
            reduced support requirements, and improved print quality.
          </Typography>
        </Alert>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label="Physics-based" size="small" color="primary" />
          <Chip label="Meniscus modeling" size="small" color="primary" />
          <Chip label="Material optimization" size="small" color="primary" />
        </Stack>
      </Box>
    ),
  },
  {
    label: 'Mode Selection',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Slicing Mode
        </Typography>
        <Typography variant="body2" paragraph>
          Convex slicing is the default and only mode in this build.
        </Typography>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Convex Slicing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Physics-based meniscus modeling<br/>
            • More accurate for liquid materials<br/>
            • Accounts for surface tension<br/>
            • Optimized for bioprinting
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    label: 'Physics Parameters',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configuring Physics Parameters
        </Typography>
        <Typography variant="body2" paragraph>
          When using convex slicing, you can configure advanced physics parameters
          that affect how the meniscus is modeled.
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Essential Parameters
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="Print Head Diameter" size="small" variant="outlined" />
              <Chip label="Surface Tension" size="small" variant="outlined" />
              <Chip label="Contact Angle" size="small" variant="outlined" />
              <Chip label="Density" size="small" variant="outlined" />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Quick Material Presets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the material preset chips to quickly configure parameters for common materials:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label="Water" size="small" color="primary" />
              <Chip label="Polymer" size="small" color="primary" />
              <Chip label="Bioink" size="small" color="primary" />
            </Stack>
          </Box>
        </Stack>
      </Box>
    ),
  },
  {
    label: 'Visualization',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Understanding the Visualizations
        </Typography>
        <Typography variant="body2" paragraph>
          Convex slicing provides several visualization tools to help you understand
          the slicing process and results.
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Height Map Legend
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The color-coded legend shows the height of the meniscus surface at each point.
              Colors range from deep purple (low) to yellow (high).
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              3D Meniscus Visualization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive 3D model showing the meniscus profile based on your physics parameters.
              Use mouse to rotate and zoom, or keyboard for basic controls.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Slice Viewer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Navigate through generated slices with playback controls. Use arrow keys for navigation,
              spacebar to play/pause, and adjust playback speed as needed.
            </Typography>
          </Box>
        </Stack>
      </Box>
    ),
  },
  {
    label: 'Export & Results',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Exporting Your Results
        </Typography>
        <Typography variant="body2" paragraph>
          Once slicing is complete, you can export your results in various formats
          with comprehensive metadata.
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Options
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="PNG" size="small" variant="outlined" />
              <Chip label="BMP" size="small" variant="outlined" />
              <Chip label="JPG" size="small" variant="outlined" />
              <Chip label="TIFF" size="small" variant="outlined" />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Included Metadata
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Physics parameters used<br/>
              • Slicing metadata<br/>
              • Meniscus control points<br/>
              • Processing timestamps
            </Typography>
          </Box>
        </Stack>
      </Box>
    ),
  },
  {
    label: 'Troubleshooting',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Common Issues & Solutions
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Slow Processing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Reduce model complexity<br/>
              • Increase layer height<br/>
              • Use lower resolution settings<br/>
              • Check available memory
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Invalid Parameters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Check parameter ranges<br/>
              • Use material presets<br/>
              • Verify physics values<br/>
              • Reset to defaults if needed
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Issues
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Check file permissions<br/>
              • Ensure sufficient disk space<br/>
              • Try different export formats<br/>
              • Reduce image quality if needed
            </Typography>
          </Box>
        </Stack>
      </Box>
    ),
  },
];

export default function ConvexSlicingGuide({ open, onClose }: ConvexSlicingGuideProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, guideSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <HelpIcon />
            <Typography variant="h6">
              Convex Slicing Guide
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {guideSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1">
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, mb: 2 }}>
                  {step.content}
                </Paper>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        <Button onClick={handleReset}>
          Reset
        </Button>
        <Button
          onClick={activeStep === guideSteps.length - 1 ? handleClose : handleNext}
          variant="contained"
          endIcon={activeStep === guideSteps.length - 1 ? undefined : <SkipNextIcon />}
        >
          {activeStep === guideSteps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
