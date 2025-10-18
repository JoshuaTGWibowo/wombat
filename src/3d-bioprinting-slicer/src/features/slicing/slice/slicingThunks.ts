import { createAsyncThunk } from '@reduxjs/toolkit';

import type { RootState } from '../../../app/store';
import { requestConvexSlice } from './convexSlicingThunks';

/**
 * Main slicing thunk that routes to the appropriate slicing method
 * based on the current slicing mode
 */
export const requestSlice = createAsyncThunk<void, void, { state: RootState }>(
  'slicing/requestSlice',
  async (_payload, { getState, dispatch }) => {
    const mode = getState().slicing.slicingMode;
    // Only convex mode is supported
    if (mode === 'convex') {
      await dispatch(requestConvexSlice());
      return;
    }
    // Fallback to convex if any unexpected value appears
    await dispatch(requestConvexSlice());
    return;
  },
);

/**
 * Legacy thunk for backward compatibility
 * @deprecated Use requestSlice instead
 */
// Planar slicing is no longer supported; legacy thunk removed.


