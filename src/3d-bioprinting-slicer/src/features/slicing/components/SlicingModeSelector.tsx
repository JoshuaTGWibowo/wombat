import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Layers, Waves } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setSlicingMode } from '../slice/slicingSlice';

interface SlicingModeOption {
  value: 'convex';
  label: string;
  icon: React.ReactElement;
  description: string;
}

const slicingModeOptions: SlicingModeOption[] = [
  {
    value: 'convex',
    label: 'Convex',
    icon: <Waves fontSize="small" />,
    description: 'Physics-based meniscus modeling'
  }
];

export default function SlicingModeSelector() {
  const dispatch = useAppDispatch();
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);

  const handleModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: 'convex' | null
  ) => {
    if (newMode !== null) {
      dispatch(setSlicingMode(newMode));
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Slicing Mode
      </Typography>
      <ToggleButtonGroup
        value={slicingMode}
        exclusive
        onChange={handleModeChange}
        aria-label="slicing mode"
        size="small"
        fullWidth
        sx={{
          '& .MuiToggleButton-root': {
            flexDirection: 'column',
            gap: 0.5,
            py: 1.5,
            px: 2,
            minHeight: 64,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          },
        }}
      >
        {slicingModeOptions.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            aria-label={option.label}
            sx={{ flex: 1 }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
              {option.icon}
              <Typography variant="caption" fontWeight="medium">
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" textAlign="center">
                {option.description}
              </Typography>
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
