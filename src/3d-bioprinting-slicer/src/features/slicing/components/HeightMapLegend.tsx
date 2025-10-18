import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useAppSelector } from '../../../app/hooks';

interface ColorStop {
  position: number;
  color: string;
  label: string;
}

const HEIGHT_MAP_COLORS: ColorStop[] = [
  { position: 0.0, color: '#440154', label: 'Low' },
  { position: 0.25, color: '#3B528B', label: '' },
  { position: 0.5, color: '#21908C', label: 'Mid' },
  { position: 0.75, color: '#5EC962', label: '' },
  { position: 1.0, color: '#FDE725', label: 'High' },
];

interface HeightMapLegendProps {
  minHeight?: number;
  maxHeight?: number;
  unit?: string;
  compact?: boolean;
}

export default function HeightMapLegend({ 
  minHeight = 0, 
  maxHeight = 1, 
  unit = 'mm',
  compact = false 
}: HeightMapLegendProps) {
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const showHeightMap = useAppSelector((state) => state.slicing.showHeightMap);

  if (!showHeightMap || !convexMetadata) {
    return null;
  }

  const actualMin = convexMetadata.colorScaleMin ?? minHeight;
  const actualMax = convexMetadata.colorScaleMax ?? maxHeight;

  const createGradient = () => {
    const stops = HEIGHT_MAP_COLORS.map(stop => 
      `${stop.color} ${stop.position * 100}%`
    ).join(', ');
    return `linear-gradient(to top, ${stops})`;
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 20,
            height: 100,
            background: createGradient(),
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
        <Box>
          <Typography variant="caption" color="text.secondary">
            Height Map
          </Typography>
          <Typography variant="caption" display="block">
            {actualMin.toFixed(2)} - {actualMax.toFixed(2)} {unit}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Height Map Legend
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box
          sx={{
            width: 20,
            height: 120,
            background: createGradient(),
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          {/* Height markers */}
          {HEIGHT_MAP_COLORS.map((stop, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: -30,
                top: `${(1 - stop.position) * 100}%`,
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {stop.label}
            </Box>
          ))}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Stack spacing={0.5}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Min Height
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                {actualMin.toFixed(2)} {unit}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Max Height
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                {actualMax.toFixed(2)} {unit}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Range
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                {(actualMax - actualMin).toFixed(2)} {unit}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Colors represent the height of the meniscus surface at each point
      </Typography>
    </Box>
  );
}
