import { useEffect, useState } from 'react';
import { Alert, Box, Stack, TextField, Typography, Paper, InputAdornment, CircularProgress, Accordion, AccordionSummary, AccordionDetails, LinearProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SlicingControls from '../../features/slicing/components/SlicingControls';
import { Button, Stack as MuiStack } from '@mui/material';
import { requestSlice } from '../../features/slicing/slice/slicingThunks';
import { cancelConvexSlice, pollConvexProgress, pollConvexResult } from '../../features/slicing/slice/convexSlicingThunks';
import ModelUploader from '../../features/model/components/ModelUploader';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setModelDimensions, setAspectLocked, setDimensionProportional, resetDimensions } from '../../features/model/slice/modelSlice';
import { FormControlLabel, Switch } from '@mui/material';

export default function ImportPanel() {
  const dispatch = useAppDispatch();
  const { modelData, dimensions, aspectLocked } = useAppSelector((s) => s.model);
  const slicingStatus = useAppSelector((s) => s.slicing.status);
  const slicingError = useAppSelector((s) => s.slicing.error);
  const progress = useAppSelector((s) => s.slicing.progress);
  const jobId = useAppSelector((s) => s.slicing.jobId);
  const [logs, setLogs] = useState<string[]>([]);

  // Minimal logs for user feedback while pending
  useEffect(() => {
    if (slicingStatus === 'pending' && logs.length === 0) {
      setLogs([`Submitting slicing job...`]);
    }
    if (slicingStatus !== 'pending' && logs.length > 0) {
      // reset logs when leaving pending
      setLogs([]);
    }
  }, [slicingStatus]);
  useEffect(() => {
    if (!jobId) return;
    setLogs((prev) => {
      if (prev.some((l) => l.includes('Job ID'))) return prev;
      const next = [...prev, `Job ID: ${jobId}`];
      return next.slice(-5);
    });
  }, [jobId]);
  useEffect(() => {
    if (typeof progress !== 'number') return;
    const pct = Math.round(progress * 100);
    setLogs((prev) => {
      // Replace any existing progress line to avoid showing 0% and 100% simultaneously
      const withoutProgress = prev.filter((l) => !l.startsWith('Progress: '));
      const next = [...withoutProgress, `Progress: ${pct}%`];
      return next.slice(-5);
    });
  }, [progress]);

  // Immediately fetch result once backend reports completion (progress === 1)
  useEffect(() => {
    if (slicingStatus !== 'pending') return;
    if (!jobId) return;
    if (progress === 1) {
      // fire-and-forget result fetch to avoid waiting for next poll tick
      dispatch(pollConvexResult());
    }
  }, [dispatch, progress, slicingStatus, jobId]);

  const height = dimensions?.height;
  const width = dimensions?.width;
  const depth = dimensions?.depth;
  const isPositive = (n: number | undefined) => typeof n === 'number' && Number.isFinite(n) && n > 0;
  const heightValid = isPositive(height);
  const widthValid = isPositive(width);
  const depthValid = isPositive(depth);
  const dimsValid = !!(heightValid && widthValid && depthValid);
  const modelReady = !!modelData;
  const canStart = modelReady && dimsValid && slicingStatus !== 'pending';
  // const canCancel = slicingStatus === 'pending';
  // Pending view: show only progress and cancel
  if (slicingStatus === 'pending') {
    const pct = typeof progress === 'number' ? Math.round(progress * 100) : undefined;
    const isFinalizing = typeof progress === 'number' && progress >= 0.99;
    return (
      <Box sx={{ p: 3, width: 340, position: 'fixed', right: 0, top: 0, bottom: 0, borderLeft: '1px solid #374151', bgcolor: '#171717', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="stretch" justifyContent="center" sx={{ width: '100%', maxWidth: 280 }}>
          <Typography variant="subtitle1" color="text.secondary" align="center">
            {isFinalizing ? 'Finalizing…' : (typeof pct === 'number' ? `Slicing ${pct}%` : 'Slicing…')}
          </Typography>
          <LinearProgress 
            variant={isFinalizing ? 'indeterminate' : (typeof pct === 'number' ? 'determinate' : 'indeterminate')} 
            value={isFinalizing ? undefined : pct} 
            sx={{ height: 8, borderRadius: 1 }} 
          />
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'transparent', borderColor: 'divider' }}>
            <Stack spacing={0.5}>
              {logs.map((line, i) => (
                <Typography key={i} variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">{line}</Typography>
              ))}
            </Stack>
          </Paper>
          <Button fullWidth variant="outlined" onClick={() => dispatch(cancelConvexSlice())}>Cancel</Button>
        </Stack>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3, width: 340, position: 'fixed', right: 0, top: 0, bottom: 0, borderLeft: '1px solid #374151', bgcolor: '#171717', overflowY: 'auto' }}>
      <Stack spacing={2.5}>

        {slicingError && (
          <Alert severity="error" variant="outlined">
            {slicingError}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" color="text.secondary">Model</Typography>
            <ModelUploader />
            {!modelReady && (
              <Typography variant="caption" color="text.secondary">
                Drop a .stl or .obj, or choose a file.
              </Typography>
            )}
          </Stack>
        </Paper>

        <Accordion disableGutters sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, minHeight: 40 }}>
            <Typography variant="subtitle2">Dimensions</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  control={<Switch size="small" checked={!!aspectLocked} onChange={(e) => dispatch(setAspectLocked(e.target.checked))} />}
                  label={<Typography variant="caption" color="text.secondary">Lock aspect ratio</Typography>}
                />
                <Button size="small" variant="outlined" onClick={() => dispatch(resetDimensions())}>Reset</Button>
              </Stack>
              <TextField
                label="Height"
                size="small"
                type="number"
                value={height ?? ''}
                error={height !== undefined && !heightValid}
                helperText={height !== undefined && !heightValid ? 'Enter a positive number' : ''}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                onChange={(e) => dispatch((aspectLocked ? setDimensionProportional({ key: 'height', value: Number(e.target.value) }) : setModelDimensions({ height: Number(e.target.value) })))}
              />
              <TextField
                label="Width"
                size="small"
                type="number"
                value={width ?? ''}
                error={width !== undefined && !widthValid}
                helperText={width !== undefined && !widthValid ? 'Enter a positive number' : ''}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                onChange={(e) => dispatch((aspectLocked ? setDimensionProportional({ key: 'width', value: Number(e.target.value) }) : setModelDimensions({ width: Number(e.target.value) })))}
              />
              <TextField
                label="Depth"
                size="small"
                type="number"
                value={depth ?? ''}
                error={depth !== undefined && !depthValid}
                helperText={depth !== undefined && !depthValid ? 'Enter a positive number' : ''}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ endAdornment: <InputAdornment position="end">mm</InputAdornment> }}
                onChange={(e) => dispatch((aspectLocked ? setDimensionProportional({ key: 'depth', value: Number(e.target.value) }) : setModelDimensions({ depth: Number(e.target.value) })))}
              />

              {/* Material & Head customization removed; configured in Physics Parameters */}
            </Stack>
          </AccordionDetails>
        </Accordion>

        

        {modelReady && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Slicing</Typography>
              <SlicingControls />
            </Stack>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" size="large" disabled={!canStart} onClick={() => {
            dispatch(requestSlice());
            // single-interval polling with simple in-flight guards
            let progressInFlight = false;
            let resultInFlight = false;
            let tick = 0;
            let interval: any;
            const onVisChange = () => {
              if (document.visibilityState === 'hidden') stop();
            };
            const stop = () => {
              if (interval) clearInterval(interval);
              document.removeEventListener('visibilitychange', onVisChange);
              window.removeEventListener('beforeunload', stop);
            };
            const poll = () => {
              const s = (window as any).__redux_store__?.getState?.();
              const st = s?.slicing?.status;
              const jobId = s?.slicing?.jobId;
              const hasSlices = (s?.slicing?.slices || []).length > 0;
              const pr = typeof s?.slicing?.progress === 'number' ? s.slicing.progress : undefined;
              if (st !== 'pending' || !jobId || hasSlices) {
                stop();
                return;
              }
              // progress every tick
              if (!progressInFlight) {
                progressInFlight = true;
                Promise.resolve(dispatch(pollConvexProgress())).finally(() => { progressInFlight = false; });
              }
              // adaptive result cadence: faster near completion
              const cadenceDivisor = pr !== undefined && pr >= 0.9 ? 1 : 4;
              const mustFetchNow = pr === 1; // if complete, fetch immediately on this tick
              if ((mustFetchNow || (tick % cadenceDivisor === 0)) && !resultInFlight) {
                resultInFlight = true;
                Promise.resolve(dispatch(pollConvexResult())).finally(() => { resultInFlight = false; });
              }
              tick += 1;
            };
            // initial immediate poll for snappier UX
            poll();
            interval = setInterval(poll, 1000);
            document.addEventListener('visibilitychange', onVisChange);
            window.addEventListener('beforeunload', stop, { once: true });
          }}>
            {slicingStatus === 'pending' ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                {typeof progress === 'number' ? `Slicing (${Math.round(progress * 100)}%)` : 'Slicing…'}
              </>
            ) : 'Start Slicing'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}


