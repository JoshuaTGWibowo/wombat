import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type SlicingStatus = 'idle' | 'pending' | 'complete' | 'failed';
type SlicingMode = 'convex';

export interface ConvexPhysicsParams {
  printHeadDiameter: number;        // 5.42 mm default
  rimStartHeight: number;          // 0.75 mm default
  contactAngleDeg: number;         // 45° default
  surfaceTension: number;         // 73.0 default
  density: number;                 // 1000.0 default
  gravity: number;                 // 9.81 default
  bezierK1: number;                // 0.25 default
  bezierK2: number;                // 0.75 default
}

export interface ConvexSlicingMetadata {
  pitch: number;
  voxelSize: number;
  numFrames: number;
  rimStartHeight: number;
  printHeadRadius: number;
  meniscusScale: number;
  controlPoints: number[][];
  imageWidth: number;
  imageHeight: number;
  bitDepth: number;
  colorMode: string;
  pixelsPerMm: number;
}

export interface SlicingState {
  // Existing fields
  layerHeight: number;
  slices: string[];
  status: SlicingStatus;
  error?: string;
  
  // New convex slicing fields
  slicingMode: SlicingMode;
  physicsParams: ConvexPhysicsParams;
  convexMetadata?: ConvexSlicingMetadata;
  outputFormat: 'bmp';
  abortController?: AbortController;
  progress?: number;
  jobId?: string;
}

const defaultPhysicsParams: ConvexPhysicsParams = {
  printHeadDiameter: 5.42,
  rimStartHeight: 0.75,
  contactAngleDeg: 45.0,
  surfaceTension: 73.0,
  density: 1000.0,
  gravity: 9.81,
  bezierK1: 0.25,
  bezierK2: 0.75,
};

const initialState: SlicingState = {
  // Existing fields
  layerHeight: 0.05,
  slices: [],
  status: 'idle',
  
  // New convex slicing fields
  slicingMode: 'convex',
  physicsParams: defaultPhysicsParams,
  convexMetadata: undefined,
  outputFormat: 'bmp',
  abortController: undefined,
  progress: undefined,
  jobId: undefined,
};

const slicingSlice = createSlice({
  name: 'slicing',
  initialState,
  reducers: {
    // Existing reducers
    setLayerHeight(state, action: PayloadAction<number>) {
      state.layerHeight = action.payload;
    },
    sliceRequested(state) {
      state.status = 'pending';
      state.error = undefined;
      state.abortController = new AbortController();
      state.progress = 0;
      state.jobId = undefined;
    },
    sliceSucceeded(state, action: PayloadAction<string[]>) {
      state.status = 'complete';
      state.slices = action.payload;
      state.abortController = undefined;
      state.progress = 1;
    },
    sliceFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
      state.abortController = undefined;
      state.progress = undefined;
    },
    clearSlices(state) {
      state.slices = [];
      state.status = 'idle';
      state.error = undefined;
      state.abortController = undefined;
      state.progress = undefined;
      state.jobId = undefined;
    },
    cancelRequested(state) {
      if (state.abortController) {
        state.abortController.abort();
      }
      state.status = 'idle';
    },
    
    // New convex slicing reducers
    setSlicingMode(state, action: PayloadAction<SlicingMode>) {
      state.slicingMode = action.payload;
    },
    setPhysicsParams(state, action: PayloadAction<Partial<ConvexPhysicsParams>>) {
      state.physicsParams = { ...state.physicsParams, ...action.payload };
    },
    resetPhysicsParams(state) {
      state.physicsParams = defaultPhysicsParams;
    },
    setOutputFormat(state, action: PayloadAction<'bmp' | 'png' | 'both'>) {
      state.outputFormat = action.payload;
    },
    setConvexMetadata(state, action: PayloadAction<ConvexSlicingMetadata>) {
      state.convexMetadata = action.payload;
    },
    setProgress(state, action: PayloadAction<number | undefined>) {
      // While pending and results not yet available, never show 100% to the user.
      // Cap at 0.99 until we transition to complete.
      if (state.status === 'pending' && (action.payload ?? 0) >= 1 && state.slices.length === 0) {
        state.progress = 0.99;
        return;
      }
      state.progress = action.payload;
    },
    setJobId(state, action: PayloadAction<string | undefined>) {
      state.jobId = action.payload;
    },
  },
});

export const { 
  setLayerHeight, 
  sliceRequested, 
  sliceSucceeded, 
  sliceFailed, 
  clearSlices,
  setSlicingMode,
  setPhysicsParams,
  resetPhysicsParams,
  setOutputFormat,
  setConvexMetadata,
  cancelRequested,
  setProgress,
  setJobId
} = slicingSlice.actions;

export default slicingSlice.reducer;


