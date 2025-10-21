import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Paper,
  LinearProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Fullscreen as FullscreenIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../../app/hooks';
import MeniscusVisualization from './MeniscusVisualization';

interface ConvexSliceViewerProps {
  onSliceSelect?: (index: number) => void;
  showMetadata?: boolean;
  showMeniscus?: boolean;
}

export default function ConvexSliceViewer({
  onSliceSelect,
  showMetadata = true,
  showMeniscus = true,
}: ConvexSliceViewerProps) {
  const slices = useAppSelector((state) => state.slicing.slices);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);
  const status = useAppSelector((state) => state.slicing.status);

  const [currentSlice, setCurrentSlice] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedFactor, setSpeedFactor] = useState<number>(1); // 1x baseline

  const handleSliceChange = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, slices.length - 1));
    setCurrentSlice(clampedIndex);
    onSliceSelect?.(clampedIndex);
  }, [slices.length, onSliceSelect]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handlePrevious = useCallback(() => {
    handleSliceChange(currentSlice - 1);
  }, [currentSlice, handleSliceChange]);

  const handleNext = useCallback(() => {
    handleSliceChange(currentSlice + 1);
  }, [currentSlice, handleSliceChange]);

  const handleFullscreen = useCallback(() => {
    // TODO: Implement fullscreen functionality
    console.log('Fullscreen not implemented yet');
  }, []);

  // Auto-play functionality
  // Derived playback delay from speed factor (baseline 1000ms @ 1x)
  const playbackDelay = useMemo(() => {
    const base = 1000;
    const clamped = Math.max(0.25, Math.min(4, speedFactor));
    return Math.round(base / clamped);
  }, [speedFactor]);

  React.useEffect(() => {
    if (isPlaying && slices.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlice(prev => (prev + 1) % slices.length);
      }, playbackDelay);

      return () => clearInterval(interval);
    }
  }, [isPlaying, slices.length, playbackDelay]);

  if (slicingMode !== 'convex') {
    return null;
  }

  if (status === 'pending') {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Generating convex slices with physics modeling...
        </Typography>
      </Paper>
    );
  }

  if (status === 'failed') {
    return (
      <Alert severity="error">
        Convex slicing failed. Please check your parameters and try again.
      </Alert>
    );
  }

  if (!slices || slices.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No convex slices available. Please run convex slicing first.
        </Typography>
      </Paper>
    );
  }

  const currentSliceData = slices[currentSlice];
  const progress = ((currentSlice + 1) / slices.length) * 100;

  return (
    <Stack spacing={2}>
      {/* Slice Navigation */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <IconButton onClick={handlePrevious} disabled={currentSlice === 0}>
            <SkipPreviousIcon />
          </IconButton>
          
          <IconButton onClick={handlePlayPause} color="primary">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          
          <IconButton onClick={handleNext} disabled={currentSlice === slices.length - 1}>
            <SkipNextIcon />
          </IconButton>
          
          <Box sx={{ flex: 1, mx: 2 }}>
            <Slider
              size="small"
              min={0}
              max={Math.max(0, slices.length - 1)}
              step={1}
              value={currentSlice}
              onChange={(_, v) => handleSliceChange(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v + 1}/${slices.length}`}
              aria-label="Slice position"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {currentSlice + 1} / {slices.length}
          </Typography>
          
          <Tooltip title="Fullscreen">
            <IconButton onClick={handleFullscreen} size="small">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Playback Speed Control (discrete factors like YouTube) */}
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Typography variant="caption" color="text.secondary">Speed:</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={speedFactor}
            onChange={(_, v) => { if (typeof v === 'number') setSpeedFactor(v); }}
          >
            <ToggleButton value={0.5}>0.5×</ToggleButton>
            <ToggleButton value={1}>1×</ToggleButton>
            <ToggleButton value={2}>2×</ToggleButton>
            <ToggleButton value={3}>3×</ToggleButton>
            <ToggleButton value={4}>4×</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Slice Image */}
        <Box 
          sx={{ 
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <img
            src={currentSliceData}
            alt={`Convex slice ${currentSlice + 1}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          
          {/* Overlay information */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '12px',
            }}
          >
            Frame {currentSlice + 1}
          </Box>
        </Box>
      </Paper>

      {/* Metadata and Controls */}
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Meniscus Visualization */}
        {showMeniscus && (
          <MeniscusVisualization width={200} height={150} />
        )}
      </Stack>

      {/* Detailed Metadata */}
      {showMetadata && convexMetadata && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <InfoIcon fontSize="small" />
            <Typography variant="subtitle2">
              Slicing Parameters
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Pitch: ${convexMetadata.pitch} mm`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`Voxel Size: ${convexMetadata.voxelSize} mm`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`Frames: ${convexMetadata.numFrames}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`Resolution: ${convexMetadata.imageWidth}×${convexMetadata.imageHeight}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip
              label={`Bit Depth: ${convexMetadata.bitDepth}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Color Mode: ${convexMetadata.colorMode}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Pixels/mm: ${convexMetadata.pixelsPerMm}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
