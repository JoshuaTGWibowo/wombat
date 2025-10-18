import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Image as ImageIcon,
  DataObject as DataObjectIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../../app/hooks';

interface SliceExportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ExportOptions {
  format: 'png' | 'bmp' | 'jpg' | 'tiff';
  quality: number;
  includeMetadata: boolean;
  includeHeightMap: boolean;
  includeMeniscusData: boolean;
  compression: 'none' | 'zip' | 'tar';
  naming: 'sequential' | 'timestamp' | 'custom';
  customPrefix: string;
}

const defaultExportOptions: ExportOptions = {
  format: 'png',
  quality: 95,
  includeMetadata: true,
  includeHeightMap: true,
  includeMeniscusData: true,
  compression: 'zip',
  naming: 'sequential',
  customPrefix: 'slice',
};

export default function SliceExportDialog({ open, onClose }: SliceExportDialogProps) {
  const slices = useAppSelector((state) => state.slicing.slices);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);
  const physicsParams = useAppSelector((state) => state.slicing.physicsParams);
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);

  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleOptionChange = useCallback((key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!slices || slices.length === 0) {
      setExportError('No slices available to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const exportData = {
        slices: slices,
        metadata: convexMetadata,
        physicsParams: physicsParams,
        exportOptions: exportOptions,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      // Create export package
      const exportPackage = await createExportPackage(exportData, exportOptions, (progress) => {
        setExportProgress(progress);
      });

      // Download the package
      const blob = new Blob([exportPackage], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `convex-slices-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [slices, convexMetadata, physicsParams, exportOptions, onClose]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      onClose();
    }
  }, [isExporting, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DownloadIcon />
          <Typography variant="h6">
            Export Convex Slices
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Export Summary */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Summary
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip 
                label={`${slices?.length || 0} slices`} 
                size="small" 
                variant="outlined" 
                icon={<ImageIcon />}
              />
              <Chip 
                label={slicingMode} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={exportOptions.format.toUpperCase()} 
                size="small" 
                variant="outlined" 
              />
              {convexMetadata && (
                <Chip 
                  label={`${convexMetadata.imageWidth}×${convexMetadata.imageHeight}`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Format Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Format Options
            </Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Image Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  onChange={(e) => handleOptionChange('format', e.target.value)}
                  label="Image Format"
                >
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="bmp">BMP</MenuItem>
                  <MenuItem value="jpg">JPG</MenuItem>
                  <MenuItem value="tiff">TIFF</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Compression</InputLabel>
                <Select
                  value={exportOptions.compression}
                  onChange={(e) => handleOptionChange('compression', e.target.value)}
                  label="Compression"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="zip">ZIP</MenuItem>
                  <MenuItem value="tar">TAR</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Quality"
                type="number"
                value={exportOptions.quality}
                onChange={(e) => handleOptionChange('quality', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
                sx={{ width: 100 }}
              />
            </Stack>
          </Box>

          {/* Naming Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              File Naming
            </Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Naming Pattern</InputLabel>
                <Select
                  value={exportOptions.naming}
                  onChange={(e) => handleOptionChange('naming', e.target.value)}
                  label="Naming Pattern"
                >
                  <MenuItem value="sequential">Sequential (slice_001.png)</MenuItem>
                  <MenuItem value="timestamp">Timestamp (slice_2024-01-01_001.png)</MenuItem>
                  <MenuItem value="custom">Custom Prefix</MenuItem>
                </Select>
              </FormControl>

              {exportOptions.naming === 'custom' && (
                <TextField
                  size="small"
                  label="Custom Prefix"
                  value={exportOptions.customPrefix}
                  onChange={(e) => handleOptionChange('customPrefix', e.target.value)}
                  placeholder="slice"
                />
              )}
            </Stack>
          </Box>

          {/* Metadata Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Include in Export
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                label="Slicing Metadata"
                size="small"
                color={exportOptions.includeMetadata ? 'primary' : 'default'}
                onClick={() => handleOptionChange('includeMetadata', !exportOptions.includeMetadata)}
                variant={exportOptions.includeMetadata ? 'filled' : 'outlined'}
              />
              <Chip
                label="Height Map Data"
                size="small"
                color={exportOptions.includeHeightMap ? 'primary' : 'default'}
                onClick={() => handleOptionChange('includeHeightMap', !exportOptions.includeHeightMap)}
                variant={exportOptions.includeHeightMap ? 'filled' : 'outlined'}
              />
              <Chip
                label="Meniscus Data"
                size="small"
                color={exportOptions.includeMeniscusData ? 'primary' : 'default'}
                onClick={() => handleOptionChange('includeMeniscusData', !exportOptions.includeMeniscusData)}
                variant={exportOptions.includeMeniscusData ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>

          {/* Progress */}
          {isExporting && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Exporting slices...
              </Typography>
              <LinearProgress variant="determinate" value={exportProgress} />
              <Typography variant="caption" color="text.secondary">
                {Math.round(exportProgress)}% complete
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {exportError && (
            <Alert severity="error">
              {exportError}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={isExporting || !slices || slices.length === 0}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Helper function to create export package
async function createExportPackage(
  data: any,
  options: ExportOptions,
  onProgress: (progress: number) => void
): Promise<Blob> {
  // This is a simplified implementation
  // In a real implementation, you would use a library like JSZip
  
  const files: { name: string; content: string | Blob }[] = [];
  
  // Add slice images
  for (let i = 0; i < data.slices.length; i++) {
    const sliceUrl = data.slices[i];
    const response = await fetch(sliceUrl);
    const blob = await response.blob();
    
    const fileName = options.naming === 'custom' 
      ? `${options.customPrefix}_${String(i + 1).padStart(3, '0')}.${options.format}`
      : `slice_${String(i + 1).padStart(3, '0')}.${options.format}`;
    
    files.push({ name: fileName, content: blob });
    onProgress((i + 1) / data.slices.length * 80);
  }
  
  // Add metadata
  if (options.includeMetadata) {
    const metadata = {
      slicingMode: 'convex',
      timestamp: data.timestamp,
      version: data.version,
      physicsParams: data.physicsParams,
      convexMetadata: data.metadata,
    };
    
    files.push({
      name: 'metadata.json',
      content: JSON.stringify(metadata, null, 2)
    });
  }
  
  onProgress(100);
  
  // For now, return a simple blob
  // In a real implementation, you would create a proper ZIP file
  return new Blob([JSON.stringify(files)], { type: 'application/zip' });
}
