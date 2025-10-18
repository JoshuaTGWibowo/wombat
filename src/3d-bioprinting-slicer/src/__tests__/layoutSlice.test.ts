import reducer, {
  wellTypeDims,
  setWellType,
  setSelectedBay,
  setViewMode,
  setSoloSelected3D,
} from '../features/layout/slice/layoutSlice';

describe('layoutSlice', () => {
  const makeState = () => reducer(undefined, { type: '@@INIT' } as any);

  test('wellTypeDims maps types to rows/cols/count', () => {
    const cases: Array<[Parameters<typeof wellTypeDims>[0], { rows: number; cols: number; count: number }]> = [
      ['PLATE_6', { rows: 2, cols: 3, count: 6 }],
      ['PLATE_24', { rows: 4, cols: 6, count: 24 }],
      ['PLATE_96', { rows: 8, cols: 12, count: 96 }],
    ];
    for (const [t, expected] of cases) {
      expect(wellTypeDims(t)).toEqual(expected);
    }
  });

  test('initializes with plate 6 and selectedBayId=1 (bays list still 9 for bay page)', () => {
    const state = makeState();
    expect(state.wellType).toBe('PLATE_6');
    expect(state.bays).toHaveLength(9);
    expect(state.selectedBayId).toBe(1);
    expect(state.viewMode).toBe('2D');
    expect(state.soloSelected3D).toBe(false);
  });

  test('setWellType adjusts bay count and clamps selection', () => {
    let state = makeState();
    state = reducer(state, setSelectedBay(9));
    expect(state.selectedBayId).toBe(9);

    state = reducer(state, setWellType('PLATE_6'));
    expect(state.bays).toHaveLength(6);
    expect(state.selectedBayId).toBe(6);

    state = reducer(state, setWellType('PLATE_96'));
    expect(state.bays).toHaveLength(96);
    expect(state.selectedBayId).toBe(6);
  });

  test('bays reinitialize contiguous IDs from 1 on well type change', () => {
    let state = makeState();
    state = reducer(state, setWellType('PLATE_24'));
    expect(state.bays).toHaveLength(24);
    expect(state.bays[0].id).toBe(1);
    expect(state.bays[23].id).toBe(24);

    state = reducer(state, setWellType('PLATE_96'));
    expect(state.bays).toHaveLength(96);
    expect(state.bays[0].id).toBe(1);
    expect(state.bays[95].id).toBe(96);
  });

  test('changing wellType clears previous bay metadata (reinit)', () => {
    let state = makeState();
    // simulate metadata assignment via reducer to avoid mutating frozen state
    state = reducer(state, { type: 'layout/setBayMetadata', payload: { id: 1, metadata: { inkType: 'A' } } } as any);
    expect(state.bays[0].metadata).toEqual({ inkType: 'A' });
    state = reducer(state, setWellType('PLATE_6'));
    expect(state.bays[0].metadata).toBeUndefined();
    expect(state.bays[0].configured).toBeUndefined();
  });

  test('view toggles', () => {
    let state = makeState();
    expect(state.viewMode).toBe('2D');
    state = reducer(state, setViewMode('3D'));
    expect(state.viewMode).toBe('3D');
    state = reducer(state, setViewMode('2D'));
    expect(state.viewMode).toBe('2D');

    expect(state.soloSelected3D).toBe(false);
    state = reducer(state, setSoloSelected3D(true));
    expect(state.soloSelected3D).toBe(true);
  });
});
