import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ModelState {
  modelData: File | null;
  compartments: unknown[];
  status: LoadStatus;
  error?: string;
  dimensions?: { height?: number; width?: number; depth?: number };
  originalDimensions?: { height: number; width: number; depth: number };
  inkType?: string;
  printHeadId?: string;
  aspectLocked?: boolean;
}

const initialState: ModelState = {
  modelData: null,
  compartments: [],
  status: 'idle',
  aspectLocked: false,
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    uploadModelRequested(state) {
      state.status = 'loading';
      state.error = undefined;
    },
    uploadModelSucceeded(state, action: PayloadAction<{ modelData: File; compartments?: unknown[] }>) {
      state.status = 'succeeded';
      state.modelData = action.payload.modelData;
      state.compartments = action.payload.compartments ?? [];
      // Reset dimensions on new upload; baseline will be captured when user sets valid dims
      state.dimensions = undefined;
      state.originalDimensions = undefined;
    },
    uploadModelFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearModel() {
      return initialState;
    },
    setModelDimensions(state, action: PayloadAction<{ height?: number; width?: number; depth?: number }>) {
      const next = { ...state.dimensions, ...action.payload } as { height?: number; width?: number; depth?: number };
      state.dimensions = next;
      // If we don't have a baseline yet and now have a full valid triple, capture it
      if (!state.originalDimensions) {
        const h = next.height, w = next.width, d = next.depth;
        const valid = [h, w, d].every((v) => typeof v === 'number' && Number.isFinite(v as number) && (v as number) > 0);
        if (valid) {
          state.originalDimensions = { height: h as number, width: w as number, depth: d as number };
        }
      }
    },
    // Reset dimensions to the original baseline if available; otherwise clear
    resetDimensions(state) {
      if (state.originalDimensions) {
        state.dimensions = { ...state.originalDimensions };
      } else {
        state.dimensions = undefined;
      }
      state.aspectLocked = false;
    },
    // Toggle whether changing one dimension scales the others proportionally
    setAspectLocked(state, action: PayloadAction<boolean>) {
      state.aspectLocked = action.payload;
    },
    // Update a single dimension; if aspectLocked, scale the others proportionally
    setDimensionProportional(
      state,
      action: PayloadAction<{ key: 'height' | 'width' | 'depth'; value: number }>,
    ) {
      const { key, value } = action.payload;
      const dims = state.dimensions ?? {};
      const current = dims[key] ?? 0;
      const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
      if (!state.aspectLocked || !current || current <= 0) {
        state.dimensions = { ...dims, [key]: safeValue };
        return;
      }
      const scale = safeValue / current;
      const next: { height?: number; width?: number; depth?: number } = { ...dims, [key]: safeValue };
      (['height', 'width', 'depth'] as const).forEach((k) => {
        if (k !== key) {
          const v = dims[k];
          if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
            next[k] = Number((v * scale).toFixed(4));
          }
        }
      });
      state.dimensions = next;
    },
    setInkType(state, action: PayloadAction<string | undefined>) {
      state.inkType = action.payload;
    },
    setPrintHeadId(state, action: PayloadAction<string | undefined>) {
      state.printHeadId = action.payload;
    },
  },
});

export const { uploadModelRequested, uploadModelSucceeded, uploadModelFailed, clearModel, setModelDimensions, resetDimensions, setAspectLocked, setDimensionProportional, setInkType, setPrintHeadId } =
  modelSlice.actions;

export default modelSlice.reducer;


