import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
 
import {
  Science as ScienceIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  BugReport as BugReportIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setSlicingMode } from '../slice/slicingSlice';
import { performanceService } from '../services/performanceService';
import { accessibilityService } from '../services/accessibilityService';
import { sliceCache } from '../services/sliceCache';
import SlicingModeSelector from './SlicingModeSelector';
import PhysicsParamsForm from './PhysicsParamsForm';
import ConvexSliceViewer from './ConvexSliceViewer';
import VirtualizedSliceViewer from './VirtualizedSliceViewer';
import Meniscus3DVisualization from './Meniscus3DVisualization';
import SliceExportDialog from './SliceExportDialog';
import ConvexSlicingGuide from './ConvexSlicingGuide';
import SlicingErrorBoundary from './SlicingErrorBoundary';

interface ConvexSlicingDashboardProps {
  onSliceComplete?: (slices: string[]) => void;
  onError?: (error: Error) => void;
}

export default function ConvexSlicingDashboard({
  onSliceComplete,
  onError,
}: ConvexSlicingDashboardProps) {
  const dispatch = useAppDispatch();
  const slicingMode = useAppSelector((state) => state.slicing.slicingMode);
  const slices = useAppSelector((state) => state.slicing.slices);
  const status = useAppSelector((state) => state.slicing.status);
  const convexMetadata = useAppSelector((state) => state.slicing.convexMetadata);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [accessibilityReport, setAccessibilityReport] = useState<any>(null);

  // Initialize services
  useEffect(() => {
    performanceService.startMonitoring();
    accessibilityService.updateConfig({ announceChanges: true });
  }, []);

  // Update performance report
  useEffect(() => {
    const updatePerformanceReport = () => {
      const report = performanceService.generateReport();
      setPerformanceReport(report);
    };

    updatePerformanceReport();
    const interval = setInterval(updatePerformanceReport, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update accessibility report
  useEffect(() => {
    const report = accessibilityService.generateAccessibilityReport();
    setAccessibilityReport(report);
  }, []);

  // Handle slice completion
  useEffect(() => {
    if (status === 'complete' && slices.length > 0) {
      onSliceComplete?.(slices);
      accessibilityService.announce(`Slicing complete. Generated ${slices.length} slices.`);
    }
  }, [status, slices, onSliceComplete]);

  // Handle errors
  useEffect(() => {
    if (status === 'failed') {
      const error = new Error('Slicing failed');
      onError?.(error);
      accessibilityService.announce('Slicing failed. Please check your parameters and try again.');
    }
  }, [status, onError]);

  const handleExportClick = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleGuideClick = useCallback(() => {
    setGuideOpen(true);
  }, []);

  const handlePerformanceTest = useCallback(async () => {
    const results = await performanceService.runPerformanceTests();
    accessibilityService.announce(
      `Performance test ${results.passed ? 'passed' : 'failed'}. Score: ${results.passed ? 'Good' : 'Needs improvement'}.`
    );
  }, []);

  const handleAccessibilityTest = useCallback(() => {
    const report = accessibilityService.generateAccessibilityReport();
    accessibilityService.announce(
      `Accessibility score: ${report.score}%. ${report.issues.length} issues found.`
    );
  }, []);

  const handleCacheCleanup = useCallback(() => {
    sliceCache.clear();
    accessibilityService.announce('Cache cleared successfully.');
  }, []);

  const isConvexMode = slicingMode === 'convex';
  const hasSlices = slices && slices.length > 0;
  const isProcessing = status === 'pending';

  return (
    <SlicingErrorBoundary>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <ScienceIcon color="primary" />
              <Typography variant="h5">
                Convex Slicing Dashboard
              </Typography>
              {isConvexMode && (
                <Chip label="Convex Mode" size="small" color="primary" />
              )}
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Performance Test">
                <IconButton onClick={handlePerformanceTest} size="small">
                  <SpeedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Accessibility Test">
                <IconButton onClick={handleAccessibilityTest} size="small">
                  <AccessibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="User Guide">
                <IconButton onClick={handleGuideClick} size="small">
                  <HelpIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Status and Progress */}
        {isProcessing && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <LinearProgress sx={{ flex: 1 }} />
              <Typography variant="body2">
                Processing convex slices with physics modeling...
              </Typography>
            </Stack>
          </Alert>
        )}

        {/* Main Content */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '4fr 5fr 3fr' } }}>
          {/* Left Panel - Controls */}
          <Box>
            <Stack spacing={3}>
              {/* Mode Selector */}
              <Paper sx={{ p: 2 }}>
                <SlicingModeSelector />
              </Paper>

              {/* Physics Parameters */}
              {isConvexMode && (
                <Paper sx={{ p: 2 }}>
                  <PhysicsParamsForm />
                </Paper>
              )}

              {/* Performance Metrics */}
              {performanceReport && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Score:</Typography>
                      <Typography variant="caption" color={performanceReport.score > 80 ? 'success.main' : 'warning.main'}>
                        {performanceReport.score}%
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Memory:</Typography>
                      <Typography variant="caption">
                        {performanceReport.metrics.memoryUsage.toFixed(1)}MB
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Frame Rate:</Typography>
                      <Typography variant="caption">
                        {performanceReport.metrics.frameRate}fps
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Accessibility Status */}
              {accessibilityReport && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Accessibility Status
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessibilityIcon fontSize="small" />
                    <Typography variant="caption">
                      Score: {accessibilityReport.score}%
                    </Typography>
                    {accessibilityReport.issues.length > 0 && (
                      <Chip label={`${accessibilityReport.issues.length} issues`} size="small" color="warning" />
                    )}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>

          {/* Center Panel - Visualization */}
          <Box>
            <Stack spacing={3}>
              {/* Slice Viewer */}
              <Paper sx={{ p: 2 }}>
                <SlicingErrorBoundary>
                  {hasSlices ? (
                    slices.length > 50 ? (
                      <VirtualizedSliceViewer />
                    ) : (
                      <ConvexSliceViewer />
                    )
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {isConvexMode 
                          ? 'Configure physics parameters and run convex slicing to see results'
                          : 'Select convex mode to access advanced slicing features'
                        }
                      </Typography>
                    </Box>
                  )}
                </SlicingErrorBoundary>
              </Paper>

              {/* 3D Visualization */}
              {isConvexMode && (
                <Paper sx={{ p: 2 }}>
                  <Meniscus3DVisualization 
                    width={400} 
                    height={250} 
                    showControls={true}
                    showParameters={true}
                  />
                </Paper>
              )}
            </Stack>
          </Box>

          {/* Right Panel - Actions and Info */}
          <Box>
            <Stack spacing={3}>
              {/* Quick Actions */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportClick}
                    disabled={!hasSlices}
                    fullWidth
                    size="small"
                  >
                    Export Slices
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HelpIcon />}
                    onClick={handleGuideClick}
                    fullWidth
                    size="small"
                  >
                    User Guide
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MemoryIcon />}
                    onClick={handleCacheCleanup}
                    fullWidth
                    size="small"
                  >
                    Clear Cache
                  </Button>
                </Stack>
              </Paper>

              {/* Slice Information */}
              {hasSlices && convexMetadata && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Slice Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Total Slices:</Typography>
                      <Typography variant="caption">{slices.length}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Pitch:</Typography>
                      <Typography variant="caption">{convexMetadata.pitch}mm</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Resolution:</Typography>
                      <Typography variant="caption">
                        {convexMetadata.imageWidth}×{convexMetadata.imageHeight}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">Color Mode:</Typography>
                      <Typography variant="caption">{convexMetadata.colorMode}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Cache Statistics */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cache Statistics
                </Typography>
                <Stack spacing={1}>
                  {(() => {
                    const stats = sliceCache.getStats();
                    return (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Entries:</Typography>
                          <Typography variant="caption">{stats.size}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Size:</Typography>
                          <Typography variant="caption">
                            {(stats.totalSize / 1024 / 1024).toFixed(1)}MB
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption">Hit Rate:</Typography>
                          <Typography variant="caption">
                            {stats.hitRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>

        {/* Export Dialog */}
        <SliceExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
        />

        {/* User Guide */}
        <ConvexSlicingGuide
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
        />
      </Box>
    </SlicingErrorBoundary>
  );
}
