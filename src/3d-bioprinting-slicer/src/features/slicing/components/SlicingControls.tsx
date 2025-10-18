import { useCallback, useState } from 'react';
import { Box, Slider, Stack, Typography, Divider, Button, IconButton, Tooltip } from '@mui/material';
import { Download as DownloadIcon, Science as ScienceIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setLayerHeight } from '../slice/slicingSlice';
import PhysicsParamsForm from './PhysicsParamsForm';
import SliceExportDialog from './SliceExportDialog';
import Meniscus3DVisualization from './Meniscus3DVisualization';

export default function SlicingControls() {
  const dispatch = useAppDispatch();
  const layerHeight = useAppSelector((s) => s.slicing.layerHeight);
  const status = useAppSelector((s) => s.slicing.status);
  const slicingMode = useAppSelector((s) => s.slicing.slicingMode);
  const slices = useAppSelector((s) => s.slicing.slices);
  // Visualization controls removed (BMP-only, no height map colors)

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const onChange = useCallback((_: Event, value: number | number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    dispatch(setLayerHeight(Number(v)));
  }, [dispatch]);

  const handleExportClick = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleExportClose = useCallback(() => {
    setExportDialogOpen(false);
  }, []);

  return (
    <Stack spacing={3}>
      {/* Slicing Mode removed */}
      
      {/* Layer Height Control */}
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Layer Height: {layerHeight.toFixed(2)} mm
        </Typography>
        <Box px={1}>
          <Slider
            min={0.01}
            max={0.1}
            step={0.01}
            value={layerHeight}
            onChange={onChange}
            aria-label="Layer height"
            disabled={status === 'pending'}
          />
        </Box>
        
        {/* Mode-specific information */}
        {slicingMode === 'convex' && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Convex slicing uses physics-based meniscus modeling for more accurate results
          </Typography>
        )}
      </Stack>
      
      {/* Physics Parameters for Convex Mode */}
      {slicingMode === 'convex' && (
        <>
          <Divider />
          <PhysicsParamsForm />
        </>
      )}

      {/* Visualization options removed (BMP-only, no height map colors) */}

      {/* Export and 3D Visualization for Convex Mode */}
      {slicingMode === 'convex' && slices && slices.length > 0 && (
        <>
          <Divider />
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">
                Advanced Features
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Export Slices">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportClick}
                  >
                    Export
                  </Button>
                </Tooltip>
                <Tooltip title="3D Meniscus Visualization">
                  <IconButton size="small">
                    <ScienceIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Meniscus3DVisualization 
              width={300} 
              height={200} 
              showControls={true}
              showParameters={true}
            />
          </Stack>
        </>
      )}

      {/* Export Dialog */}
      <SliceExportDialog
        open={exportDialogOpen}
        onClose={handleExportClose}
      />
    </Stack>
  );
}


