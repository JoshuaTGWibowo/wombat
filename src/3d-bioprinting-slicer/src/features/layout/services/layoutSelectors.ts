import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';

export const selectLayout = (s: RootState) => s.layout;
export const selectBays = (s: RootState) => s.layout.bays;
export const selectSelectedBayId = (s: RootState) => s.layout.selectedBayId;

export const selectBayById = (id: number) =>
  createSelector(selectBays, (bays) => bays.find((b) => b.id === id));

export const selectConfiguredBays = createSelector(selectBays, (bays) =>
  bays.filter((b) => b.configured),
);


