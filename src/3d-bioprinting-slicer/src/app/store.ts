import { configureStore } from '@reduxjs/toolkit';

import modelReducer from '../features/model/slice/modelSlice';
import slicingReducer from '../features/slicing/slice/slicingSlice';
import uiReducer from '../features/ui/slice/uiSlice';
import layoutReducer from '../features/layout/slice/layoutSlice';
import scriptReducer from '../features/script/slice/scriptSlice';

export const store = configureStore({
  reducer: {
    model: modelReducer,
    slicing: slicingReducer,
    ui: uiReducer,
    layout: layoutReducer,
    script: scriptReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // We intentionally store File objects and an AbortController in state
        ignoredPaths: ['model.modelData', 'slicing.abortController'],
        ignoredActionPaths: ['payload.modelData'],
        ignoredActions: [
          'slicing/sliceRequested',
          'slicing/setJobId',
          'slicing/setProgress',
          'model/uploadModelSucceeded',
          'slicing/requestConvexSlice/pending',
          'slicing/requestConvexSlice/fulfilled',
          'slicing/requestSlice/pending',
          'slicing/requestSlice/fulfilled',
        ],
      },
    }),
});

// Expose store for debug hooks used in polling cleanup
if (typeof window !== 'undefined') {
  (window as any).__redux_store__ = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


