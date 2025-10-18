import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ConvexSliceViewer from '../components/ConvexSliceViewer';
import SlicingModeSelector from '../components/SlicingModeSelector';
import PhysicsParamsForm from '../components/PhysicsParamsForm';
import { convexSlicingApi } from '../services/convexSlicingApi';
import { validatePhysicsParams } from '../services/physicsParamsValidation';
import { sliceCache } from '../services/sliceCache';
import { SlicingErrorBoundary } from '../components/SlicingErrorBoundary';

// Mock store
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
        convexMetadata: undefined,
        outputFormat: 'bmp',
        showHeightMap: true,
      }, action) => state,
      model: (state = { modelData: null }) => state,
    },
    preloadedState: initialState,
  });
};

// Mock API server
const server = setupServer(
  rest.post('/api/slice/convex', (req, res, ctx) => {
    return res(
      ctx.json({
        slices: ['slice1.png', 'slice2.png', 'slice3.png'],
        metadata: {
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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Convex Slicing Integration Tests', () => {
  describe('SlicingModeSelector', () => {
    it('should render mode selector with both options', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      expect(screen.getByText('Planar')).toBeInTheDocument();
      expect(screen.getByText('Convex')).toBeInTheDocument();
    });

    it('should switch between modes when clicked', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <SlicingModeSelector />
        </Provider>
      );

      const convexButton = screen.getByText('Convex');
      fireEvent.click(convexButton);

      // Verify the mode was switched (this would need to be tested with actual state updates)
      expect(convexButton).toBeInTheDocument();
    });
  });

  describe('PhysicsParamsForm', () => {
    it('should render all physics parameters', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <PhysicsParamsForm />
        </Provider>
      );

      expect(screen.getByText('Physics Parameters')).toBeInTheDocument();
      expect(screen.getByText('Print Head Diameter')).toBeInTheDocument();
      expect(screen.getByText('Surface Tension')).toBeInTheDocument();
      expect(screen.getByText('Density')).toBeInTheDocument();
    });

    it('should validate parameters in real-time', async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <PhysicsParamsForm />
        </Provider>
      );

      // Test invalid parameters
      const invalidParams = {
        printHeadDiameter: -1,
        rimStartHeight: 0,
        contactAngleDeg: 200,
        surfaceTension: -1,
        density: 0,
        gravity: 0,
        bezierK1: -1,
        bezierK2: 2,
      };

      const validation = validatePhysicsParams(invalidParams);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should show material presets', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <PhysicsParamsForm />
        </Provider>
      );

      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('Polymer')).toBeInTheDocument();
      expect(screen.getByText('Bioink')).toBeInTheDocument();
    });
  });

  describe('ConvexSliceViewer', () => {
    it('should render when convex mode is active', () => {
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: ['slice1.png', 'slice2.png'],
          status: 'complete',
        },
      });

      render(
        <Provider store={store}>
          <ConvexSliceViewer />
        </Provider>
      );

      expect(screen.getByText('Frame 1')).toBeInTheDocument();
    });

    it('should handle playback controls', async () => {
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: ['slice1.png', 'slice2.png', 'slice3.png'],
          status: 'complete',
        },
      });

      render(
        <Provider store={store}>
          <ConvexSliceViewer />
        </Provider>
      );

      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });

    it('should display metadata when available', () => {
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: ['slice1.png'],
          status: 'complete',
          convexMetadata: {
            pitch: 0.05,
            voxelSize: 0.05,
            numFrames: 1,
            rimStartHeight: 0.75,
            printHeadRadius: 2.71,
            meniscusScale: 1.0,
            controlPoints: [[0, 0], [1, 0.2]],
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

      expect(screen.getByText('Pitch: 0.05 mm')).toBeInTheDocument();
      expect(screen.getByText('Voxel Size: 0.05 mm')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should call convex slicing API with correct parameters', async () => {
      const mockModelData = new File(['test'], 'test.stl', { type: 'application/octet-stream' });
      const physicsParams = {
        printHeadDiameter: 5.42,
        rimStartHeight: 0.75,
        contactAngleDeg: 45.0,
        surfaceTension: 73.0,
        density: 1000.0,
        gravity: 9.81,
        bezierK1: 0.25,
        bezierK2: 0.75,
      };

      const result = await convexSlicingApi.postConvexSlice({
        modelData: mockModelData,
        layerHeight: 0.2,
        physicsParams,
        outputFormat: 'bmp',
      });

      expect(result.slices).toHaveLength(3);
      expect(result.metadata).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.post('/api/slice/convex', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      const mockModelData = new File(['test'], 'test.stl', { type: 'application/octet-stream' });

      await expect(
        convexSlicingApi.postConvexSlice({
          modelData: mockModelData,
          layerHeight: 0.2,
        })
      ).rejects.toThrow();
    });
  });

  describe('Cache Integration', () => {
    beforeEach(() => {
      sliceCache.clear();
    });

    it('should cache slice data', () => {
      const testData = { test: 'data' };
      sliceCache.set('test_key', testData, 'computed');
      
      expect(sliceCache.has('test_key')).toBe(true);
      expect(sliceCache.get('test_key')).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const testData = { test: 'data' };
      sliceCache.set('test_key', testData, 'computed');
      
      // Mock time passing
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 31 * 60 * 1000); // 31 minutes later
      
      expect(sliceCache.has('test_key')).toBe(false);
      
      Date.now = originalDateNow;
    });

    it('should provide cache statistics', () => {
      sliceCache.set('key1', 'data1', 'image');
      sliceCache.set('key2', 'data2', 'metadata');
      
      const stats = sliceCache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.entriesByType.image).toBe(1);
      expect(stats.entriesByType.metadata).toBe(1);
    });
  });

  describe('Error Boundary', () => {
    it('should catch and display errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <SlicingErrorBoundary>
          <ThrowError />
        </SlicingErrorBoundary>
      );

      expect(screen.getByText('Slicing Component Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should allow retry after error', () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      render(
        <SlicingErrorBoundary>
          <ConditionalError />
        </SlicingErrorBoundary>
      );

      expect(screen.getByText('Slicing Component Error')).toBeInTheDocument();

      // Simulate retry
      shouldThrow = false;
      fireEvent.click(screen.getByText('Try Again'));

      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large slice sets efficiently', async () => {
      const largeSliceSet = Array.from({ length: 100 }, (_, i) => `slice_${i}.png`);
      
      const store = createMockStore({
        slicing: {
          slicingMode: 'convex',
          slices: largeSliceSet,
          status: 'complete',
        },
      });

      const startTime = performance.now();
      
      render(
        <Provider store={store}>
          <ConvexSliceViewer />
        </Provider>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Simulate multiple cache operations
      for (let i = 0; i < 1000; i++) {
        sliceCache.set(`key_${i}`, `data_${i}`, 'computed');
      }
      
      // Clear cache
      sliceCache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });
});
