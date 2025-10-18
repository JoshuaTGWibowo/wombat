import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { postGenerateScript } from '../services/scriptApi';
import { generateFailed, generateRequested, generateSucceeded } from './scriptSlice';

export const requestGenerateScript = createAsyncThunk<void, void, { state: RootState }>(
  'script/requestGenerateScript',
  async (_payload, { getState, dispatch }) => {
    const { layout } = getState();
    try {
      dispatch(generateRequested());
      const { script } = await postGenerateScript({ layout });
      dispatch(generateSucceeded(script));
    } catch (err) {
      dispatch(generateFailed(String(err)));
    }
  },
);


