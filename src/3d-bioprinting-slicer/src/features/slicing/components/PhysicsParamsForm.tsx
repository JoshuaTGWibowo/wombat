import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Collapse,
  ButtonBase,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
 
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setPhysicsParams, resetPhysicsParams } from '../slice/slicingSlice';
import { validatePhysicsParams, getParameterSuggestions } from '../services/physicsParamsValidation';

interface PhysicsParamField {
  key: keyof typeof defaultPhysicsParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

const defaultPhysicsParams = {
  printHeadDiameter: 5.42,
  rimStartHeight: 0.75,
  contactAngleDeg: 45.0,
  surfaceTension: 73.0,
  density: 1000.0,
  gravity: 9.81,
  bezierK1: 0.25,
  bezierK2: 0.75,
};

const physicsParamFields: PhysicsParamField[] = [
  {
    key: 'printHeadDiameter',
    label: 'Print Head Diameter',
    unit: 'mm',
    min: 0.1,
    max: 20.0,
    step: 0.01,
    description: 'Diameter of the print head nozzle'
  },
  {
    key: 'rimStartHeight',
    label: 'Rim Start Height',
    unit: 'mm',
    min: 0.1,
    max: 5.0,
    step: 0.01,
    description: 'Starting height of the container rim'
  },
  {
    key: 'contactAngleDeg',
    label: 'Contact Angle',
    unit: '°',
    min: 0,
    max: 180,
    step: 1,
    description: 'Contact angle between liquid and surface'
  },
  {
    key: 'surfaceTension',
    label: 'Surface Tension',
    unit: 'mN/m',
    min: 1.0,
    max: 1000.0,
    step: 0.1,
    description: 'Surface tension of the printing material'
  },
  {
    key: 'density',
    label: 'Density',
    unit: 'kg/m³',
    min: 100.0,
    max: 5000.0,
    step: 1.0,
    description: 'Density of the printing material'
  },
  {
    key: 'gravity',
    label: 'Gravity',
    unit: 'm/s²',
    min: 1.0,
    max: 20.0,
    step: 0.01,
    description: 'Gravitational acceleration'
  },
  {
    key: 'bezierK1',
    label: 'Bézier K1',
    unit: '',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'First Bézier control point coefficient'
  },
  {
    key: 'bezierK2',
    label: 'Bézier K2',
    unit: '',
    min: 0.0,
    max: 1.0,
    step: 0.01,
    description: 'Second Bézier control point coefficient'
  },
];

export default function PhysicsParamsForm({ renderHeader = true }: { renderHeader?: boolean }) {
  const dispatch = useAppDispatch();
  const physicsParams = useAppSelector((state) => state.slicing.physicsParams);
  const [expanded, setExpanded] = React.useState(false);

  // Real-time validation
  const validation = useMemo(() => {
    return validatePhysicsParams(physicsParams);
  }, [physicsParams]);

  const handleParamChange = useCallback((key: keyof typeof defaultPhysicsParams, value: number) => {
    dispatch(setPhysicsParams({ [key]: value }));
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetPhysicsParams());
  }, [dispatch]);

  const handleMaterialSuggestion = useCallback((materialType: 'water' | 'polymer' | 'bioink') => {
    const suggestions = getParameterSuggestions(materialType);
    dispatch(setPhysicsParams(suggestions));
  }, [dispatch]);

  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const content = (
    <Box sx={{ p: 2, pt: 0 }}>
          {/* Validation Alerts */}
          {validation.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Parameter Errors:
              </Typography>
              {validation.errors.map((error, index) => (
                <Typography key={index} variant="caption" display="block">
                  • {error.field}: {error.message}
                </Typography>
              ))}
            </Alert>
          )}
          
          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Parameter Warnings:
              </Typography>
              {validation.warnings.map((warning, index) => (
                <Typography key={index} variant="caption" display="block">
                  • {warning.field}: {warning.message}
                </Typography>
              ))}
            </Alert>
          )}

          {/* Material Suggestions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Quick Material Presets:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip 
                label="Water" 
                size="small" 
                onClick={() => handleMaterialSuggestion('water')}
                variant="outlined"
              />
              <Chip 
                label="Polymer" 
                size="small" 
                onClick={() => handleMaterialSuggestion('polymer')}
                variant="outlined"
              />
              <Chip 
                label="Bioink" 
                size="small" 
                onClick={() => handleMaterialSuggestion('bioink')}
                variant="outlined"
              />
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
            {physicsParamFields.map((field) => {
              const fieldErrors = validation.errors.filter(e => e.field === field.key);
              const fieldWarnings = validation.warnings.filter(w => w.field === field.key);
              const hasError = fieldErrors.length > 0;
              const hasWarning = fieldWarnings.length > 0;

              return (
                <Box key={field.key}>
                  <FormControl fullWidth size="small" error={hasError}>
                    <InputLabel htmlFor={`physics-${field.key}`}>
                      {field.label}
                    </InputLabel>
                    <OutlinedInput
                      id={`physics-${field.key}`}
                      type="number"
                      value={physicsParams[field.key]}
                      onChange={(e) => handleParamChange(field.key, Number(e.target.value))}
                      endAdornment={
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {field.unit}
                        </Typography>
                      }
                      inputProps={{
                        min: field.min,
                        max: field.max,
                        step: field.step,
                      }}
                      color={hasError ? 'error' : hasWarning ? 'warning' : 'primary'}
                    />
                    <FormHelperText>
                      {fieldErrors.length > 0 ? fieldErrors[0].message : 
                       fieldWarnings.length > 0 ? fieldWarnings[0].message : 
                       field.description}
                    </FormHelperText>
                  </FormControl>
                </Box>
              );
            })}
          </Box>
          
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="outlined"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
              >
                Reset to Defaults
              </Button>
            </Stack>
          </Box>
    </Box>
  );

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {renderHeader ? (
        <>
          <ButtonBase
            component="div"
            sx={{
              textAlign: 'left',
              width: '100%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={toggleExpanded}
            aria-label="Toggle physics parameters"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Box>
                <Typography variant="subtitle2" fontWeight="medium">
                  Physics Parameters
                </Typography>
              </Box>
              {/* Validation Status */}
              <Box display="flex" alignItems="center" gap={0.5} sx={{ pointerEvents: 'none' }}>
                {validation.isValid ? (
                  <Tooltip title="All parameters are valid">
                    <CheckCircleIcon color="success" fontSize="small" />
                  </Tooltip>
                ) : (
                  <Tooltip title={`${validation.errors.length} errors, ${validation.warnings.length} warnings`}>
                    <ErrorIcon color="error" fontSize="small" />
                  </Tooltip>
                )}
                {validation.warnings.length > 0 && (
                  <Tooltip title={`${validation.warnings.length} warnings`}>
                    <WarningIcon color="warning" fontSize="small" />
                  </Tooltip>
                )}
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </ButtonBase>
          <Collapse in={expanded}>{content}</Collapse>
        </>
      ) : (
        content
      )}
    </Paper>
  );
}
