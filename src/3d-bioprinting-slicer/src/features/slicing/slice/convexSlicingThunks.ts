import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { postConvexSlice, getConvexSlicingProgress, getConvexSlicingResult, deleteConvexSlicingJob } from '../services/convexSlicingApi';
import { validatePhysicsParams as validateLocalPhysicsParams } from '../services/physicsParamsValidation';
import { sliceFailed, sliceRequested, sliceSucceeded, setConvexMetadata, cancelRequested, setProgress, setJobId, clearSlices } from './slicingSlice';

export const requestConvexSlice = createAsyncThunk<void, void, { state: RootState }>(
  'slicing/requestConvexSlice',
  async (_payload, { getState, dispatch }) => {
    const state = getState();
    const modelFile = state.model.modelData;
    const dimensions = state.model.dimensions;
    const layerHeight = state.slicing.layerHeight;
    const physicsParams = state.slicing.physicsParams;
    const outputFormat = state.slicing.outputFormat;

    if (!modelFile) {
      dispatch(sliceFailed('Please upload a model file before slicing.'));
      return;
    }

    try {
      // Client-side validation first to prevent avoidable 4xx/5xx errors
      const validation = validateLocalPhysicsParams(physicsParams);
      if (!validation.isValid) {
        const errorText = validation.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        dispatch(sliceFailed(`Invalid physics parameters: ${errorText}`));
        return;
      }

      dispatch(sliceRequested());
      const { slices, metadata, jobId } = await postConvexSlice({ 
        modelData: modelFile, 
        layerHeight,
        physicsParams,
        outputFormat,
        dimensions
      }, getState().slicing.abortController?.signal);
      if (jobId) {
        dispatch(setJobId(jobId));
        dispatch(setProgress(0));
      }
      // If immediate response has slices, set them; otherwise, they'll be fetched by pollResults
      if (slices && slices.length) {
        dispatch(sliceSucceeded(slices));
      }
      if (metadata) {
        dispatch(setConvexMetadata(metadata));
      }
    } catch (err) {
      if ((err as any)?.name === 'CanceledError' || (err as any)?.code === 'ERR_CANCELED') {
        dispatch(sliceFailed('Convex slicing canceled.'));
        return;
      }
      const anyErr = err as any;
      const backendMessage = anyErr?.response?.data?.message || anyErr?.response?.data?.detail || anyErr?.response?.data?.error;
      const status = anyErr?.response?.status;
      if (anyErr?.code === 'ECONNREFUSED' || anyErr?.message?.includes('ECONNREFUSED')) {
        dispatch(sliceFailed('Backend unavailable. Check that the slicing service is running and reachable.'));
        return;
      }
      const errorMessage = backendMessage
        ? `Convex slicing failed${status ? ` (HTTP ${status})` : ''}: ${backendMessage}`
        : (err instanceof Error ? err.message : String(err));
      dispatch(sliceFailed(errorMessage));
    }
  },
);

export const pollConvexProgress = createAsyncThunk<void, void, { state: RootState }>(
  'slicing/pollConvexProgress',
  async (_payload, { getState, dispatch }) => {
    const { status, jobId } = getState().slicing;
    if (status !== 'pending' || !jobId) return;
    try {
      const { progress } = await getConvexSlicingProgress(jobId);
      dispatch(setProgress(progress));
    } catch {
      // ignore transient errors
    }
  },
);

export const pollConvexResult = createAsyncThunk<void, void, { state: RootState }>(
  'slicing/pollConvexResult',
  async (_payload, { getState, dispatch }) => {
    const { status, jobId } = getState().slicing;
    if (status !== 'pending' || !jobId) return;
    try {
      const data = await getConvexSlicingResult(jobId);
      if (data.ready) {
        // Debug: log when result arrives
        try { console.debug('[slicing] result ready', { slices: data.slices?.length, metadata: data.metadata }); } catch {}
        dispatch(sliceSucceeded(data.slices || []));
        if (data.metadata) dispatch(setConvexMetadata(data.metadata));
      }
    } catch (e) {
      // if server returns error, surface it
      const msg = (e as any)?.response?.data?.detail || (e as Error).message;
      dispatch(sliceFailed(msg));
    }
  },
);

export const cancelConvexSlice = createAsyncThunk<void, void, { state: RootState }>(
  'slicing/cancelConvexSlice',
  async (_payload, { getState, dispatch }) => {
    // Abort any in-flight request
    dispatch(cancelRequested());
    const jobId = getState().slicing.jobId;
    if (jobId) {
      try {
        await deleteConvexSlicingJob(jobId);
      } catch {
        // ignore errors; best-effort delete
      }
    }
    // Clear all slicing state without showing error
    dispatch(clearSlices());
  },
);

// Planar slicing is no longer supported.
