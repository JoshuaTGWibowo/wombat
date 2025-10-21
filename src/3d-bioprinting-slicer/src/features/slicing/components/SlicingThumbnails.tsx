import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useAppSelector } from '../../../app/hooks';
import ConvexSliceViewer from './ConvexSliceViewer';
import VirtualizedSliceViewer from './VirtualizedSliceViewer';
import SlicingErrorBoundary from './SlicingErrorBoundary';
import React from 'react';
import { sliceCache } from '../services/sliceCache';

export default function SlicingThumbnails() {
  const slices = useAppSelector((s) => s.slicing.slices);
  const sliceCount = slices?.length || 0;
  const [preloading, setPreloading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!slices || slices.length === 0) return;
      setPreloading(true);
      setProgress(0);
      try {
        await sliceCache.preloadSlices(slices, (p) => { if (!cancelled) setProgress(p); });
        if (!cancelled) setReady(true);
      } finally {
        if (!cancelled) setPreloading(false);
      }
    };
    setReady(false);
    run();
    return () => { cancelled = true; };
  }, [slices]);
  
  if (!slices || slices.length === 0) return null;

  if (!ready && preloading) {
    return (
      <Box sx={{ position: 'fixed', top: 0, left: 64, right: 340, bottom: 0, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 3, maxWidth: 420, width: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Preparing slices…</Typography>
            <LinearProgress variant="determinate" value={progress * 100} />
            <Typography variant="caption" color="text.secondary">{Math.round(progress * 100)}%</Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Convex-only viewers
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 64, right: 340, bottom: 0, p: 3, overflow: 'auto' }}>
      <SlicingErrorBoundary>
        {sliceCount > 50 ? (
          <VirtualizedSliceViewer maxCacheSize={sliceCount} showMetadata={false} showMeniscus={false} />
        ) : (
          <ConvexSliceViewer />
        )}
      </SlicingErrorBoundary>
    </Box>
  );
}


