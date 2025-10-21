import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Slider,
  
} from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../../app/hooks';
import { sliceCache } from '../services/sliceCache';
import MeniscusVisualization from './MeniscusVisualization';

interface VirtualizedSliceViewerProps {
  onSliceSelect?: (index: number) => void;
  showMetadata?: boolean;
  showMeniscus?: boolean;
  maxCacheSize?: number;
}

interface SliceCache {
  [key: number]: {
    image: HTMLImageElement;
    loaded: boolean;
    error?: string;
  };
}

export default function VirtualizedSliceViewer({
  onSliceSelect,
  showMetadata = true,
  showMeniscus = true,
  maxCacheSize = 50,
}: VirtualizedSliceViewerProps) {
  const slices = useAppSelector((state) => state.slicing.slices);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);
  const status = useAppSelector((state) => state.slicing.status);

  const [currentSlice, setCurrentSlice] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedFactor, setSpeedFactor] = useState<number>(1); // 1x baseline
  const [cache, setCache] = useState<SliceCache>({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  const cacheRef = useRef<SliceCache>({});
  const loadingRef = useRef<Set<number>>(new Set());
  const objectUrlRef = useRef<Map<number, string>>(new Map());
  // Removed fullscreen handling; no container ref needed

  // Performance monitoring
  const updateMemoryUsage = useCallback(() => {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perf.memory && typeof perf.memory.usedJSHeapSize === 'number') {
      const used = perf.memory.usedJSHeapSize / (1024 * 1024); // MB
      setMemoryUsage(used);
    }
  }, []);

  // Cache management
  const loadSlice = useCallback((index: number) => {
    if (cacheRef.current[index]?.loaded || loadingRef.current.has(index)) {
      return;
    }

    const cachedBlob = sliceCache.get(`slice_${index}`) as Blob | null;
    
    // If already cached (preloaded), load immediately
    if (cachedBlob) {
      loadingRef.current.add(index);
      const useBlob = async (blob: Blob) => {
        // Reuse existing object URL if available
        let url = objectUrlRef.current.get(index);
        if (!url) {
          url = URL.createObjectURL(blob);
          objectUrlRef.current.set(index, url);
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setCache(prev => ({
            ...prev,
            [index]: { image: img, loaded: true }
          }));
          cacheRef.current[index] = { image: img, loaded: true };
          loadingRef.current.delete(index);
          updateMemoryUsage();
        };
        img.onerror = () => {
          setCache(prev => ({
            ...prev,
            [index]: { image: img, loaded: false, error: 'Failed to load' }
          }));
          cacheRef.current[index] = { image: img, loaded: false, error: 'Failed to load' };
          loadingRef.current.delete(index);
        };
        img.src = url;
      };
      void useBlob(cachedBlob);
      return;
    }

    // If not cached, fetch from network
    loadingRef.current.add(index);
    fetch(slices[index])
      .then(res => res.blob())
      .then(blob => {
        sliceCache.set(`slice_${index}`, blob, 'image');
        const useBlob = async (blob: Blob) => {
          let url = objectUrlRef.current.get(index);
          if (!url) {
            url = URL.createObjectURL(blob);
            objectUrlRef.current.set(index, url);
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setCache(prev => ({
              ...prev,
              [index]: { image: img, loaded: true }
            }));
            cacheRef.current[index] = { image: img, loaded: true };
            loadingRef.current.delete(index);
            updateMemoryUsage();
          };
          img.onerror = () => {
            setCache(prev => ({
              ...prev,
              [index]: { image: img, loaded: false, error: 'Failed to load' }
            }));
            cacheRef.current[index] = { image: img, loaded: false, error: 'Failed to load' };
            loadingRef.current.delete(index);
          };
          img.src = url;
        };
        return useBlob(blob);
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        setCache(prev => ({
          ...prev,
          [index]: { image: img, loaded: false, error: 'Failed to load' }
        }));
        cacheRef.current[index] = { image: img, loaded: false, error: 'Failed to load' };
        loadingRef.current.delete(index);
      });
  }, [slices, updateMemoryUsage]);

  // Preload adjacent slices
  const preloadAdjacent = useCallback((centerIndex: number, range: number = 2) => {
    const targets: number[] = [];
    for (let i = Math.max(0, centerIndex - range); i <= Math.min(slices.length - 1, centerIndex + range); i++) {
      if (i !== centerIndex) targets.push(i);
    }
    const urls = targets.map(i => slices[i]);
    // Warm the global cache; loadSlice will consume from it
    void sliceCache.preloadSlices(urls);
    targets.forEach(i => loadSlice(i));
  }, [slices, loadSlice]);

  // Cache cleanup
  const cleanupCache = useCallback(() => {
    const cacheEntries = Object.keys(cacheRef.current).map(Number);
    if (cacheEntries.length <= maxCacheSize) return;

    // Remove oldest entries (simple LRU)
    const sortedEntries = cacheEntries.sort((a, b) => a - b);
    const toRemove = sortedEntries.slice(0, cacheEntries.length - maxCacheSize);
    
    toRemove.forEach(index => {
      if (!sliceCache.has(`slice_${index}`)) {
        delete cacheRef.current[index];
      }
      const url = objectUrlRef.current.get(index);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlRef.current.delete(index);
      }
    });

    setCache(prev => {
      const newCache = { ...prev } as any;
      toRemove.forEach(index => {
        if (!sliceCache.has(`slice_${index}`)) {
          delete newCache[index as any];
        }
      });
      return newCache;
    });
  }, [maxCacheSize]);

  // Load current slice and preload adjacent
  useEffect(() => {
    if (slices.length === 0) return;

    loadSlice(currentSlice);
    preloadAdjacent(currentSlice);
    cleanupCache();
  }, [currentSlice, slices.length, loadSlice, preloadAdjacent, cleanupCache]);

  // Loading progress calculation
  useEffect(() => {
    const total = slices.length;
    const loaded = Object.values(cacheRef.current).filter(entry => entry.loaded).length;
    setLoadingProgress((loaded / total) * 100);
  }, [slices.length, cache]);

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


  // Collapsible speed control
  const [showSpeedControls, setShowSpeedControls] = useState<boolean>(false);


  // Derived playback delay from speed factor (baseline 1000ms @ 1x)
  const playbackDelay = useMemo(() => {
    const base = 1000;
    const clamped = Math.max(0.25, Math.min(5, speedFactor));
    return Math.round(base / clamped);
  }, [speedFactor]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && slices.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlice(prev => (prev + 1) % slices.length);
      }, playbackDelay);

      return () => clearInterval(interval);
    }
  }, [isPlaying, slices.length, playbackDelay]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    cacheSize: Object.keys(cacheRef.current).length,
    memoryUsage,
    loadingProgress,
    totalSlices: slices.length,
  }), [memoryUsage, loadingProgress, slices.length]);


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
  const cachedSlice = cacheRef.current[currentSlice];

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
          
          <Tooltip title={showSpeedControls ? "Hide speed" : "Show speed"}>
            <IconButton onClick={() => setShowSpeedControls(v => !v)} size="small">
              <SpeedIcon />
            </IconButton>
          </Tooltip>

        </Stack>

        {/* Playback Speed Control (collapsible) */}
        {showSpeedControls && (
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <SpeedIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Speed:
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={speedFactor}
              onChange={(_, v) => { if (typeof v === 'number') setSpeedFactor(v); }}
            >
              <ToggleButton value={0.5}>0.5×</ToggleButton>
              <ToggleButton value={1}>1×</ToggleButton>
              <ToggleButton value={3}>3×</ToggleButton>
              <ToggleButton value={5}>5×</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {/* Slice Image */}
        <Box 
          sx={{ 
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {cachedSlice?.loaded ? (
            <img
              src={currentSliceData}
              alt={`Convex slice ${currentSlice + 1}`}
              decoding="async"
              loading="eager"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          ) : cachedSlice?.error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load slice {currentSlice + 1}
            </Alert>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading slice {currentSlice + 1}...
              </Typography>
            </Box>
          )}
          
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
