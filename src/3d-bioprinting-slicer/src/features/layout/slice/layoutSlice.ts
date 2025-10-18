import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * Well type constants for microplates (excludes 3x3, which is static for Bay Configuration).
 */
export const WellTypes = {
  PLATE_6: 'PLATE_6',
  PLATE_24: 'PLATE_24',
  PLATE_96: 'PLATE_96',
} as const;

export type WellType = (typeof WellTypes)[keyof typeof WellTypes];

export interface BayMetadata {
  inkType?: string;
  printHeadId?: string;
}

export interface BayConfig {
  id: number;
  modelId?: string;
  metadata?: BayMetadata;
  configured?: boolean;
}

export interface LayoutState {
  wellType: WellType;
  bays: BayConfig[];
  /** Selected bay id is 1-based; undefined means no selection. */
  selectedBayId?: number;
  /** Current rendering mode for the bay configuration view. */
  viewMode: '2D' | '3D';
  /** If true, only the selected bay is shown in 3D view. */
  soloSelected3D: boolean;
}

/** Returns grid rows/cols and total bay count for a given well type. */
export function wellTypeDims(t: WellType): { rows: number; cols: number; count: number } {
  switch (t) {
    case WellTypes.PLATE_6:
      // Standard 6-well microplate: 2 rows x 3 columns
      return { rows: 2, cols: 3, count: 6 };
    case WellTypes.PLATE_24:
      // Standard 24-well microplate: 4 rows x 6 columns
      return { rows: 4, cols: 6, count: 24 };
    case WellTypes.PLATE_96:
      // Standard 96-well microplate: 8 rows x 12 columns
      return { rows: 8, cols: 12, count: 96 };
    default: {
      const _exhaustive: never = t as never;
      throw new Error(`Unhandled well type: ${_exhaustive}`);
    }
  }
}

/** Creates an array of empty bays with 1-based sequential ids. */
function createBays(count: number): BayConfig[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
}

/** Finds a bay by id. */
function getBay(state: LayoutState, id: number | undefined): BayConfig | undefined {
  if (!id) return undefined;
  return state.bays.find((b) => b.id === id);
}

// Bay page uses a static 3x3 grid (9 bays)
const initialBays: BayConfig[] = createBays(9);

const initialState: LayoutState = {
  wellType: WellTypes.PLATE_6,
  bays: initialBays,
  selectedBayId: 1,
  viewMode: '2D',
  soloSelected3D: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    /**
     * Switches well type (plate size). Reinitializes well list for well configuration,
     * clamping the selected bay id into range. Bay page remains a fixed 3x3 grid.
     */
    setWellType(state, action: PayloadAction<WellType>) {
      state.wellType = action.payload;
      const { count } = wellTypeDims(action.payload);
      state.bays = createBays(count);
      const current = state.selectedBayId ?? 1;
      state.selectedBayId = Math.min(current, count);
    },
    setViewMode(state, action: PayloadAction<'2D' | '3D'>) {
      state.viewMode = action.payload;
    },
    setSoloSelected3D(state, action: PayloadAction<boolean>) {
      state.soloSelected3D = action.payload;
    },
    /** Sets selected bay id. If a number is provided, it is clamped to [1, bays.length]. */
    setSelectedBay(state, action: PayloadAction<number | undefined>) {
      const val = action.payload;
      if (typeof val === 'number' && Number.isFinite(val)) {
        const max = Math.max(1, state.bays.length);
        const clamped = Math.min(Math.max(1, Math.floor(val)), max);
        state.selectedBayId = clamped;
      } else {
        state.selectedBayId = undefined;
      }
    },
    /**
     * Merges metadata into a bay. Sets configured=true only if metadata contains
     * at least one defined field.
     */
    setBayMetadata(state, action: PayloadAction<{ id: number; metadata: BayMetadata }>) {
      const bay = getBay(state, action.payload.id);
      if (bay) {
        const incoming = action.payload.metadata;
        bay.metadata = { ...(bay.metadata ?? {}), ...incoming };
        const hasMeaningful = Object.values(incoming).some((v) => v != null);
        if (hasMeaningful) bay.configured = true;
      }
    },
    assignBayModel(state, action: PayloadAction<{ id: number; modelId: string }>) {
      const bay = getBay(state, action.payload.id);
      if (bay) {
        bay.modelId = action.payload.modelId;
        bay.configured = true;
      }
    },
    clearBay(state, action: PayloadAction<number>) {
      const bay = getBay(state, action.payload);
      if (bay) {
        bay.modelId = undefined;
        bay.metadata = undefined;
        bay.configured = false;
      }
    },
  },
});

export const {
  setWellType,
  setSelectedBay,
  setBayMetadata,
  assignBayModel,
  clearBay,
  setViewMode,
  setSoloSelected3D,
} = layoutSlice.actions;

export default layoutSlice.reducer;


