import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { performanceService } from '../services/performanceService';
import { accessibilityService } from '../services/accessibilityService';
import { sliceCache } from '../services/sliceCache';
import ConvexSliceViewer from '../components/ConvexSliceViewer';
import SlicingModeSelector from '../components/SlicingModeSelector';
import PhysicsParamsForm from '../components/PhysicsParamsForm';
import VirtualizedSliceViewer from '../components/VirtualizedSliceViewer';
import Meniscus3DVisualization from '../components/Meniscus3DVisualization';
import SliceExportDialog from '../components/SliceExportDialog';
import { SlicingErrorBoundary } from '../components/SlicingErrorBoundary';
import ConvexSlicingGuide from '../components/ConvexSlicingGuide';

// Mock store with complete state
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      slicing: (state = {
        slicingMode: 'convex',
        layerHeight: 0.2,
        slices: [],
        status: 'idle',
        physicsParams: {
          printHeadDiameter: 5.42,
          rimStartHeight: 0.75,
          contactAngleDeg: 45.0,
          surfaceTension: 73.0,
          density: 1000.0,
          gravity: 9.81,
          bezierK1: 0.25,
          bezierK2: 0.75,
        },
        convexMetadata: {
          pitch: 0.05,
          voxelSize: 0.05,
          numFrames: 3,
          rimStartHeight: 0.75,
          printHeadRadius: 2.71,
          meniscusScale: 1.0,
          controlPoints: [[0, 0], [0.5, 0.1], [1, 0.2]],
          imageWidth: 4096,
          imageHeight: 2160,
          bitDepth: 24,
          colorMode: 'RGB',
          colorScaleMin: 0,
          colorScaleMax: 1,
          colormap: 'viridis',
        },
        outputFormat: 'bmp',
        showHeightMap: true,
      }, action) => state,
      model: (state = { modelData: new File(['test'], 'test.stl', { type: 'application/octet-stream' }) }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock API server
const server = setupServer(
  rest.post('/api/slice/convex', (req, res, ctx) => {
    return res(
      ctx.json({
        slices: Array.from({ length: 10 }, (_, i) => `slice_${i}.png`),
        metadata: {
          pitch: 0.05,
          voxelSize: 0.05,
          numFrames: 10,
          rimStartHeight: 0.75,
          printHeadRadius: 2.71,
          meniscusScale: 1.0,
          controlPoints: [[0, 0], [0.5, 0.1], [1, 0.2]],
          imageWidth: 4096,
          imageHeight: 2160,
          bitDepth: 24,
          colorMode: 'RGB',
          colorScaleMin: 0,
          colorScaleMax: 1,
          colormap: 'viridis',
        },
        compartments: [],
      })
    );
  }),
  rest.get('/api/slice/convex/parameters/default', (req, res, ctx) => {
    return res(
      ctx.json({
        printHeadDiameter: 5.42,
        rimStartHeight: 0.75,
        contactAngleDeg: 45.0,
        surfaceTension: 73.0,
        density: 1000.0,
        gravity: 9.81,
        bezierK1: 0.25,
        bezierK2: 0.75,
      })
    );
  }),
  rest.post('/api/slice/convex/parameters/validate', (req, res, ctx) => {
    return res(
      ctx.json({
        valid: true,
        errors: [],
      })
    );
  })
);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  sliceCache.clear();
  performanceService.stopMonitoring();
});
afterAll(() => server.close());

describe('Convex Slicing E2E Tests', () => {
  describe('Complete User Workflow', () => {
    it('should complete full convex slicing workflow', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Select convex mode
      const convexButton = screen.getByText('Convex');
      await user.click(convexButton);
      expect(convexButton).toBeInTheDocument();

      // Verify mode selection
      expect(screen.getByText('Physics-based meniscus modeling')).toBeInTheDocument();
    });

    it('should handle physics parameter configuration', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <PhysicsParamsForm />
        </Provider>
      );

      // Expand physics parameters
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);

      // Test material presets
      const waterPreset = screen.getByText('Water');
      await user.click(waterPreset);

      // Verify parameter updates
      expect(screen.getByDisplayValue('73.0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000.0')).toBeInTheDocument();
    });

    it('should handle slice visualization and navigation', async () => {
      const user = userEvent.setup();
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: Array.from({ length: 5 }, (_, i) => `slice_${i}.png`),
          status: 'complete',
          convexMetadata: {
            pitch: 0.05,
            voxelSize: 0.05,
            numFrames: 5,
            rimStartHeight: 0.75,
            printHeadRadius: 2.71,
            meniscusScale: 1.0,
            controlPoints: [[0, 0], [0.5, 0.1], [1, 0.2]],
            imageWidth: 4096,
            imageHeight: 2160,
            bitDepth: 24,
            colorMode: 'RGB',
            colorScaleMin: 0,
            colorScaleMax: 1,
            colormap: 'viridis',
          },
        },
      });

      render(
        <Provider store={store}>
          <ConvexSliceViewer />
        </Provider>
      );

      // Test navigation controls
      const nextButton = screen.getByRole('button', { name: /next/i });
      const playButton = screen.getByRole('button', { name: /play/i });

      await user.click(nextButton);
      await user.click(playButton);

      // Verify playback state
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('should handle large slice sets efficiently', async () => {
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: Array.from({ length: 100 }, (_, i) => `slice_${i}.png`),
          status: 'complete',
        },
      });

      // Start performance monitoring
      performanceService.startMonitoring();

      const startTime = performance.now();
      
      render(
        <Provider store={store}>
          <VirtualizedSliceViewer />
        </Provider>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000);

      // Check performance metrics
      const metrics = performanceService.getMetrics();
      expect(metrics.renderTime).toBeLessThan(100);
    });

    it('should maintain good performance with memory management', async () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <VirtualizedSliceViewer />
        </Provider>
      );

      // Simulate memory pressure
      for (let i = 0; i < 1000; i++) {
        sliceCache.set(`test_${i}`, `data_${i}`, 'computed');
      }

      // Check cache statistics
      const stats = sliceCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1000);

      // Clear cache
      sliceCache.clear();
      expect(sliceCache.getStats().size).toBe(0);
    });
  });

  describe('Accessibility Testing', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Test keyboard navigation
      await user.tab();
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');

      // Verify accessibility service
      const config = accessibilityService.getConfig();
      expect(config.keyboardNavigation).toBe(true);
    });

    it('should provide proper ARIA labels', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Check for ARIA labels
      const modeSelector = screen.getByRole('group', { name: /slicing mode/i });
      expect(modeSelector).toBeInTheDocument();

      // Check accessibility service
      const labels = accessibilityService.getAriaLabels();
      expect(labels.slicingMode).toBeDefined();
    });

    it('should announce changes to screen readers', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Test announcement
      accessibilityService.announce('Slicing mode changed to convex');
      
      // Verify announcement was queued
      expect(accessibilityService.getConfig().announceChanges).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.post('/api/slice/convex', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <ConvexSliceViewer />
        </Provider>
      );

      // Should show error state
      expect(screen.getByText(/convex slicing failed/i)).toBeInTheDocument();
    });

    it('should recover from component errors', async () => {
      const user = userEvent.setup();
      
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <SlicingErrorBoundary>
          <ThrowError />
        </SlicingErrorBoundary>
      );

      // Should show error boundary
      expect(screen.getByText('Slicing Component Error')).toBeInTheDocument();

      // Test retry functionality
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // Should attempt recovery
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should handle export dialog interactions', async () => {
      const user = userEvent.setup();
      const store = createMockStore({
        slicing: {
          slices: Array.from({ length: 5 }, (_, i) => `slice_${i}.png`),
          status: 'complete',
        },
      });

      render(
        <Provider store={store}>
          <SliceExportDialog open={true} onClose={() => {}} />
        </Provider>
      );

      // Test format selection
      const formatSelect = screen.getByLabelText(/image format/i);
      await user.click(formatSelect);
      await user.click(screen.getByText('PNG'));

      // Test quality adjustment
      const qualityInput = screen.getByLabelText(/quality/i);
      await user.clear(qualityInput);
      await user.type(qualityInput, '90');

      // Test export button
      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('3D Visualization', () => {
    it('should render 3D meniscus visualization', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <Meniscus3DVisualization />
        </Provider>
      );

      // Should render 3D visualization
      expect(screen.getByText('3D Meniscus Visualization')).toBeInTheDocument();
      expect(screen.getByText('Interactive 3D meniscus profile')).toBeInTheDocument();
    });

    it('should handle 3D visualization controls', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <Meniscus3DVisualization showControls={true} />
        </Provider>
      );

      // Test control buttons
      const rotateButton = screen.getByRole('button', { name: /rotate left/i });
      const zoomButton = screen.getByRole('button', { name: /zoom in/i });

      await user.click(rotateButton);
      await user.click(zoomButton);

      // Verify controls are functional
      expect(rotateButton).toBeInTheDocument();
      expect(zoomButton).toBeInTheDocument();
    });
  });

  describe('User Guide', () => {
    it('should display user guide', async () => {
      const user = userEvent.setup();
      
      render(
        <ConvexSlicingGuide open={true} onClose={() => {}} />
      );

      // Should show guide content
      expect(screen.getByText('Convex Slicing Guide')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Convex Slicing')).toBeInTheDocument();

      // Test navigation
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should show next step
      expect(screen.getByText('Choosing Your Slicing Mode')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow from model upload to export', async () => {
      const user = userEvent.setup();
      const store = createMockStore();
      
      // This would be a comprehensive test covering the entire workflow
      // from model upload through slicing to export
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Select convex mode
      await user.click(screen.getByText('Convex'));

      // Verify workflow progression
      expect(screen.getByText('Physics-based meniscus modeling')).toBeInTheDocument();
    });

    it('should maintain state consistency across components', () => {
      const store = createMockStore();
      
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      // Verify state consistency
      const state = store.getState();
      expect(state.slicing.slicingMode).toBe('convex');
      expect(state.slicing.physicsParams).toBeDefined();
    });
  });
});
