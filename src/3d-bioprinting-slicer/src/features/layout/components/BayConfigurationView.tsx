import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setSelectedBay } from '../slice/layoutSlice';
import BayCell from './BayCell';

export default function BayConfigurationView() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.layout.selectedBayId);
  const cols = 3;
  const count = 9;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selectedId == null) return;
      const idx = Math.max(0, Math.min(count - 1, (selectedId ?? 1) - 1));
      if (idx < 0) return;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = row * cols + Math.min(cols - 1, col + 1);
      if (e.key === 'ArrowLeft') nextIdx = row * cols + Math.max(0, col - 1);
      if (e.key === 'ArrowDown') nextIdx = Math.min(count - 1, idx + cols);
      if (e.key === 'ArrowUp') nextIdx = Math.max(0, idx - cols);
      if (nextIdx !== idx) {
        e.preventDefault();
        dispatch(setSelectedBay(nextIdx + 1));
      }
    },
    [selectedId, dispatch],
  );

  return (
    <Box role="grid" aria-label="Bay grid" tabIndex={0} onKeyDown={onKeyDown} sx={{ p: 3, ml: 8 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Bay Configuration
      </Typography>
      <Box
        sx={{
          border: '1px dashed #374151',
          borderRadius: 2,
          p: 3,
          display: 'grid',
          gridTemplateColumns: `repeat(3, 1fr)`,
          gridTemplateRows: `repeat(3, 1fr)`,
          width: 880,
          height: 880,
          gap: 2,
        }}
      >
        {Array.from({ length: 9 }, (_, i) => i + 1).map((id) => (
          <BayCell key={id} id={id} />
        ))}
      </Box>
    </Box>
  );
}
