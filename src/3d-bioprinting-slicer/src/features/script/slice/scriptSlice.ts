import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type ScriptStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface ScriptState {
  status: ScriptStatus;
  script?: string;
  error?: string;
}

const initialState: ScriptState = {
  status: 'idle',
};

const scriptSlice = createSlice({
  name: 'script',
  initialState,
  reducers: {
    generateRequested(state) {
      state.status = 'pending';
      state.error = undefined;
      state.script = undefined;
    },
    generateSucceeded(state, action: PayloadAction<string>) {
      state.status = 'succeeded';
      state.script = action.payload;
    },
    generateFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearScript() {
      return initialState;
    },
  },
});

export const { generateRequested, generateSucceeded, generateFailed, clearScript } =
  scriptSlice.actions;

export default scriptSlice.reducer;


