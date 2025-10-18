import React, { useMemo } from 'react';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import { useAppSelector } from '../../../app/hooks';

interface MeniscusVisualizationProps {
  width?: number;
  height?: number;
  showControlPoints?: boolean;
  showParameters?: boolean;
}

export default function MeniscusVisualization({ 
  width = 300, 
  height = 200,
  showControlPoints = true,
  showParameters = true 
}: MeniscusVisualizationProps) {
  const physicsParams = useAppSelector((state) => state.slicing.physicsParams);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);

  const meniscusProfile = useMemo(() => {
    if (!convexMetadata?.controlPoints || convexMetadata.controlPoints.length === 0) {
      return null;
    }

    // Generate meniscus profile from control points
    const points = convexMetadata.controlPoints;
    const profile = [];
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const radius = t * (physicsParams.printHeadDiameter / 2);
      
      // Simple Bézier curve interpolation
      const height = points.reduce((acc, point, index) => {
        const n = points.length - 1;
        const binomial = (n: number, k: number): number => {
          if (k > n) return 0;
          if (k === 0 || k === n) return 1;
          return binomial(n - 1, k - 1) + binomial(n - 1, k);
        };
        return acc + point[1] * binomial(n, index) * Math.pow(t, index) * Math.pow(1 - t, n - index);
      }, 0);
      
      profile.push({ radius, height });
    }
    
    return profile;
  }, [convexMetadata, physicsParams.printHeadDiameter]);

  if (slicingMode !== 'convex' || !meniscusProfile) {
    return null;
  }

  const maxRadius = Math.max(...meniscusProfile.map(p => p.radius));
  const maxHeight = Math.max(...meniscusProfile.map(p => p.height));
  const minHeight = Math.min(...meniscusProfile.map(p => p.height));

  const scaleX = (width - 40) / maxRadius;
  const scaleY = (height - 40) / (maxHeight - minHeight);

  const pathData = meniscusProfile
    .map((point, index) => {
      const x = 20 + point.radius * scaleX;
      const y = height - 20 - (point.height - minHeight) * scaleY;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2 
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Meniscus Profile
      </Typography>
      
      <Box sx={{ position: 'relative', mb: 2 }}>
        <svg width={width} height={height} style={{ border: '1px solid #e0e0e0', borderRadius: 4 }}>
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Meniscus curve */}
          <path
            d={pathData}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Control points */}
          {showControlPoints && convexMetadata?.controlPoints && (
            <>
              {convexMetadata.controlPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={20 + point[0] * scaleX}
                  cy={height - 20 - (point[1] - minHeight) * scaleY}
                  r="3"
                  fill="#FF6B6B"
                  stroke="#fff"
                  strokeWidth="1"
                />
              ))}
            </>
          )}
          
          {/* Axes */}
          <line x1="20" y1="20" x2="20" y2={height - 20} stroke="#666" strokeWidth="1" />
          <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="#666" strokeWidth="1" />
          
          {/* Axis labels */}
          <text x="10" y={height / 2} textAnchor="middle" fontSize="10" fill="#666" transform={`rotate(-90, 10, ${height / 2})`}>
            Height (mm)
          </text>
          <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="10" fill="#666">
            Radius (mm)
          </text>
        </svg>
      </Box>
      
      {showParameters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip 
            label={`Contact Angle: ${physicsParams.contactAngleDeg}°`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={`Surface Tension: ${physicsParams.surfaceTension} mN/m`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={`Density: ${physicsParams.density} kg/m³`} 
            size="small" 
            variant="outlined" 
          />
        </Stack>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Steady-state meniscus profile based on physics parameters
      </Typography>
    </Paper>
  );
}
