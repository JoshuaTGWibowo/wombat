import { useMemo } from 'react';
import { Box, Paper, Stack, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearSlices } from '../../features/slicing/slice/slicingSlice';
import { cancelConvexSlice } from '../../features/slicing/slice/convexSlicingThunks';

function formatBytes(bytes?: number | null) {
  if (!bytes && bytes !== 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function ReviewPanel() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const modelData = useAppSelector((s) => s.model.modelData);
  const dimensions = useAppSelector((s) => s.model.dimensions);
  const physics = useAppSelector((s) => s.slicing.physicsParams);
  const layerHeight = useAppSelector((s) => s.slicing.layerHeight);
  const convexMetadata = useAppSelector((s) => s.slicing.convexMetadata);

  const fileName = modelData?.name ?? 'Untitled model';
  const fileSize = useMemo(() => formatBytes(modelData?.size ?? null), [modelData]);

  const onContinue = () => {
    navigate('/layout');
  };

  const onCancel = () => {
    // Cancel slicing and delete job on server, then clear local state
    dispatch(cancelConvexSlice());
    navigate('/import');
  };

  return (
    <Box sx={{ p: 3, width: 340, position: 'fixed', right: 0, top: 0, bottom: 0, borderLeft: '1px solid #374151', bgcolor: '#171717', overflowY: 'auto' }}>
      <Stack spacing={2.5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">File</Typography>
            <Typography variant="body2">{fileName}</Typography>
            <Typography variant="caption" color="text.secondary">{fileSize}</Typography>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">Dimensions</Typography>
            <Typography variant="body2">
              W: {dimensions?.width ?? '-'} × D: {dimensions?.depth ?? '-'} × H: {dimensions?.height ?? '-'} mm
            </Typography>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">Slicing Parameters</Typography>
            
            {/* Geometry & Resolution */}
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Geometry
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Layer ${layerHeight.toFixed(2)}mm`} size="small" variant="outlined" />
                {convexMetadata && (
                  <>
                    <Chip label={`Pitch ${convexMetadata.pitch}mm`} size="small" variant="outlined" />
                    <Chip label={`Voxel ${convexMetadata.voxelSize}mm`} size="small" variant="outlined" />
                  </>
                )}
              </Stack>
            </Stack>

            {/* Print Head & Physics */}
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Print Head & Physics
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Ø ${physics.printHeadDiameter.toFixed(1)}mm`} size="small" variant="outlined" />
                <Chip label={`Rim ${physics.rimStartHeight.toFixed(1)}mm`} size="small" variant="outlined" />
                <Chip label={`θ ${physics.contactAngleDeg.toFixed(0)}°`} size="small" variant="outlined" />
                <Chip label={`σ ${physics.surfaceTension.toFixed(0)}mN/m`} size="small" variant="outlined" />
              </Stack>
            </Stack>

            {/* Output Resolution */}
            {convexMetadata && (
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Output
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {convexMetadata.imageWidth}×{convexMetadata.imageHeight} • {convexMetadata.bitDepth}bit • {convexMetadata.colorMode}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>


        {/* 3D meniscus visualization removed per request */}

        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="contained" size="large" onClick={onContinue}>Continue</Button>
          <Button fullWidth variant="text" size="large" onClick={onCancel}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  );
}


