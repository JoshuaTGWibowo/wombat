import { Box, Typography, Stack, FormControlLabel, Switch } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { wellTypeDims, setViewMode, setSoloSelected3D, setSelectedBay } from '../slice/layoutSlice';
import ContainerSelector from './ContainerSelector';
import BayGrid3D from './BayGrid3D';

function WellCell({ id, isSelected, onSelect }: { id: number; isSelected: boolean; onSelect: (id: number) => void }) {
  return (
    <Box
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: '1px solid #374151',
        bgcolor: 'background.paper',
        outline: isSelected ? '2px solid #8B5CF6' : 'none',
        boxShadow: isSelected ? '0 0 0 4px rgba(139,92,246,.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        cursor: 'pointer',
        '&:hover': { borderColor: '#6B7280' },
        '&:focus-visible': { outline: '2px solid #8B5CF6', boxShadow: '0 0 0 4px rgba(139,92,246,.2)' },
      }}
    >
      <Typography variant="h6">{id}</Typography>
    </Box>
  );
}

export default function WellConfigurationPage() {
  const dispatch = useAppDispatch();
  const wellType = useAppSelector((s) => s.layout.wellType);
  const selectedBayId = useAppSelector((s) => s.layout.selectedBayId);
  const dims = wellTypeDims(wellType);
  const viewMode = useAppSelector((s) => s.layout.viewMode);
  const soloSelected3D = useAppSelector((s) => s.layout.soloSelected3D);

  const handleSelect = (id: number) => dispatch(setSelectedBay(id));

  // No special-casing here; selector excludes 3x3, so nothing to do.

  return (
    <Box sx={{ p: 3, ml: 8 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Well Configuration — Well {selectedBayId ?? '-'}</Typography>
        <ContainerSelector />

        {viewMode === '3D' ? (
          <Box sx={{ border: '1px dashed #374151', borderRadius: 2, p: 1, width: 880, height: 880, position: 'relative' }}>
            <BayGrid3D />
            <Box sx={{ position: 'absolute', top: 8, right: 12, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, px: 1 }}>
              <FormControlLabel
                control={<Switch size="small" checked={soloSelected3D} onChange={(e) => dispatch(setSoloSelected3D(e.target.checked))} />}
                label={<Typography variant="body2">Solo selected</Typography>}
                sx={{ m: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              border: '1px dashed #374151',
              borderRadius: 2,
              p: 3,
              display: 'grid',
              gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
              gridTemplateRows: `repeat(${dims.rows}, 1fr)`,
              width: 880,
              height: 880,
              gap: 2,
            }}
          >
            {Array.from({ length: dims.count }, (_, i) => i + 1).map((id) => (
              <WellCell key={id} id={id} isSelected={id === (selectedBayId ?? -1)} onSelect={handleSelect} />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box
            role="button"
            aria-pressed={viewMode === '2D'}
            tabIndex={0}
            onClick={() => dispatch(setViewMode('2D'))}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch(setViewMode('2D')); } }}
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: viewMode === '2D' ? 'primary.main' : 'background.paper',
              color: viewMode === '2D' ? '#0b0620' : 'text.secondary',
              border: viewMode === '2D' ? 'none' : '1px solid #374151',
              borderRadius: 1,
              cursor: 'pointer',
            }}
          >
            2D
          </Box>
          <Box
            role="button"
            aria-pressed={viewMode === '3D'}
            tabIndex={0}
            onClick={() => dispatch(setViewMode('3D'))}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch(setViewMode('3D')); } }}
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: viewMode === '3D' ? 'primary.main' : 'background.paper',
              color: viewMode === '3D' ? '#0b0620' : 'text.secondary',
              border: viewMode === '3D' ? 'none' : '1px solid #374151',
              borderRadius: 1,
              cursor: 'pointer',
            }}
          >
            3D
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
