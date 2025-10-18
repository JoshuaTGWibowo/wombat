import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ActiveView = '3D_PREVIEW' | 'IMPORT';

export interface NotificationItem {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface UiState {
  activeView: ActiveView;
  notifications: NotificationItem[];
}

const initialState: UiState = {
  activeView: 'IMPORT',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<ActiveView>) {
      state.activeView = action.payload;
    },
    pushNotification(state, action: PayloadAction<NotificationItem>) {
      state.notifications.push(action.payload);
    },
    dismissNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
  },
});

export const { setActiveView, pushNotification, dismissNotification } = uiSlice.actions;

export default uiSlice.reducer;


