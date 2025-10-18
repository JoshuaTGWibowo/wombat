# Convex-Slicing Integration Plan

**Version:** 1.0  
**Date:** December 2024  
**Author:** Senior Frontend Engineer  
**Status:** Planning Phase

## Executive Summary

This document outlines a comprehensive plan to integrate the convex-slicing mechanism into the existing React/TypeScript frontend. The integration follows Apple/iOS design principles with a focus on maintainability, scalability, consistency, efficiency, and modularity.

## Current State Analysis

### Existing Architecture
- **Frontend:** React 18 + TypeScript + Redux Toolkit + MUI v5
- **Current Slicing:** Basic planar slicing with layer height control
- **State Management:** Feature-based Redux slices (model, slicing, layout, script, ui)
- **API:** RESTful endpoints with FormData for file uploads
- **UI Framework:** Material-UI with custom dark theme

### Convex-Slicing Mechanism
- **Technology:** Python-based with trimesh, numpy, PIL
- **Output:** RGB BMP frames with height-mapped colors (viridis colormap)
- **Parameters:** Physics-based (surface tension, density, gravity, print head geometry)
- **Features:** Steady-phase meniscus computation, Bézier curve approximation
- **Resolution:** 4K DCI (4096×2160) output frames

## Integration Strategy

### 1. Backend Integration Architecture

#### 1.1 API Gateway Pattern
```
Frontend → API Gateway → Convex-Slicing Service
                ↓
         Traditional Slicing Service (fallback)
```

**Rationale:** Maintain backward compatibility while introducing advanced slicing capabilities.

#### 1.2 Service Endpoints
```typescript
// New convex slicing endpoints
POST /api/slice/convex
  Body: {
    modelData: File,
    layerHeight: number,
    physicsParams?: ConvexPhysicsParams,
    outputFormat?: 'bmp' | 'png' | 'both'
  }
  Response: {
    slices: string[], // URLs to slice images
    metadata: ConvexSlicingMetadata,
    compartments?: CompartmentData[]
  }

GET /api/slice/convex/parameters/default
  Response: ConvexPhysicsParams

POST /api/slice/convex/parameters/validate
  Body: ConvexPhysicsParams
  Response: { valid: boolean, errors?: string[] }
```

#### 1.3 Physics Parameters Interface
```typescript
interface ConvexPhysicsParams {
  printHeadDiameter: number;        // 5.42 mm default
  rimStartHeight: number;          // 0.75 mm default
  contactAngleDeg: number;         // 45° default
  surfaceTension: number;         // 73.0 default
  density: number;                 // 1000.0 default
  gravity: number;                 // 9.81 default
  bezierK1: number;                // 0.25 default
  bezierK2: number;                // 0.75 default
}
```

### 2. Frontend State Management Updates

#### 2.1 Enhanced Slicing Slice
```typescript
interface SlicingState {
  // Existing fields
  layerHeight: number;
  slices: string[];
  status: SlicingStatus;
  error?: string;
  
  // New convex slicing fields
  slicingMode: 'planar' | 'convex';
  physicsParams: ConvexPhysicsParams;
  convexMetadata?: ConvexSlicingMetadata;
  outputFormat: 'bmp' | 'png' | 'both';
  showHeightMap: boolean; // Toggle for height-mapped visualization
}

interface ConvexSlicingMetadata {
  pitch: number;
  voxelSize: number;
  numFrames: number;
  rimStartHeight: number;
  printHeadRadius: number;
  meniscusScale: number;
  controlPoints: number[][];
  imageWidth: number;
  imageHeight: number;
  bitDepth: number;
  colorMode: string;
  colorScaleMin: number;
  colorScaleMax: number;
  colormap: string;
}
```

#### 2.2 New Actions
```typescript
// Slicing mode control
setSlicingMode(mode: 'planar' | 'convex')
setPhysicsParams(params: Partial<ConvexPhysicsParams>)
resetPhysicsParams()
setOutputFormat(format: 'bmp' | 'png' | 'both')
toggleHeightMap()

// Enhanced slicing thunks
requestConvexSlice()
requestPlanarSlice() // existing, renamed for clarity
```

### 3. UI/UX Design Implementation

#### 3.1 Slicing Mode Selector
**Location:** SlicingControls component  
**Design:** iOS-style segmented control

```typescript
<SegmentedControl
  value={slicingMode}
  onChange={setSlicingMode}
  options={[
    { value: 'planar', label: 'Planar', icon: 'layers' },
    { value: 'convex', label: 'Convex', icon: 'waves' }
  ]}
/>
```

#### 3.2 Physics Parameters Panel
**Location:** New collapsible section in ConfigurationPanel  
**Design:** iOS Settings-style grouped controls

```typescript
<CollapsibleSection
  title="Physics Parameters"
  subtitle="Advanced meniscus modeling"
  icon="science"
  expanded={showPhysicsParams}
>
  <PhysicsParamsForm
    params={physicsParams}
    onChange={setPhysicsParams}
    onReset={resetPhysicsParams}
  />
</CollapsibleSection>
```

#### 3.3 Enhanced Slice Visualization
**Features:**
- Height-map color legend
- Slice metadata overlay
- Physics parameter indicators
- Meniscus profile visualization

```typescript
<SliceViewer
  slices={slices}
  metadata={convexMetadata}
  showHeightMap={showHeightMap}
  physicsParams={physicsParams}
/>
```

### 4. Component Architecture

#### 4.1 New Components
```
src/features/slicing/components/
├── ConvexSlicingControls.tsx      # Physics parameters UI
├── SlicingModeSelector.tsx        # Mode switching
├── PhysicsParamsForm.tsx          # Parameter input form
├── HeightMapLegend.tsx            # Color scale legend
├── MeniscusVisualization.tsx      # 3D meniscus preview
└── ConvexSliceViewer.tsx          # Enhanced slice display
```

#### 4.2 Enhanced Services
```
src/features/slicing/services/
├── convexSlicingApi.ts            # Convex slicing API calls
├── physicsParamsValidation.ts     # Parameter validation
└── slicingApi.ts                  # Updated with mode routing
```

### 5. Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Backend API integration setup
- [ ] Enhanced Redux slice implementation
- [ ] Basic convex slicing API calls
- [ ] Slicing mode selector component

#### Phase 2: Core Features (Week 3-4)
- [ ] Physics parameters form
- [ ] Convex slicing thunks
- [ ] Enhanced slice visualization
- [ ] Height-map color legend

#### Phase 3: Advanced Features (Week 5-6)
- [ ] Meniscus visualization
- [ ] Parameter validation
- [ ] Performance optimization
- [ ] Error handling improvements

#### Phase 4: Polish & Testing (Week 7-8)
- [ ] UI/UX refinements
- [ ] Accessibility improvements
- [ ] Performance testing
- [ ] Integration testing

### 6. Technical Considerations

#### 6.1 Performance Optimization
- **Lazy Loading:** Load convex slicing parameters only when needed
- **Caching:** Cache physics parameter validation results
- **Debouncing:** Debounce parameter changes to prevent excessive API calls
- **Image Optimization:** Implement progressive loading for large slice images

#### 6.2 Error Handling
```typescript
interface ConvexSlicingError {
  type: 'validation' | 'computation' | 'rendering' | 'api';
  message: string;
  details?: {
    parameter?: string;
    value?: any;
    suggestion?: string;
  };
}
```

#### 6.3 Accessibility
- **Keyboard Navigation:** Full keyboard support for physics parameters
- **Screen Readers:** ARIA labels for complex visualizations
- **Color Contrast:** Ensure height-map colors meet WCAG standards
- **Focus Management:** Clear focus indicators for mode switching

### 7. Design System Integration

#### 7.1 iOS-Inspired Components
```typescript
// Segmented Control (iOS style)
<SegmentedControl
  variant="ios"
  size="medium"
  fullWidth
/>

// Physics Parameters (iOS Settings style)
<SettingsGroup
  title="Physics Parameters"
  description="Advanced meniscus modeling for convex slicing"
>
  <SettingsItem
    label="Surface Tension"
    value={surfaceTension}
    unit="mN/m"
    type="number"
  />
</SettingsGroup>
```

#### 7.2 Color System
```typescript
// Height-map color scale
const HEIGHT_MAP_COLORS = {
  min: '#440154', // Deep purple
  mid: '#21908C', // Teal
  max: '#FDE725'  // Yellow
} as const;
```

### 8. Testing Strategy

#### 8.1 Unit Tests
- Physics parameter validation
- Redux slice actions and reducers
- Component rendering and interactions

#### 8.2 Integration Tests
- API integration with convex slicing service
- End-to-end slicing workflow
- Error handling scenarios

#### 8.3 Visual Regression Tests
- Slice visualization consistency
- UI component appearance
- Responsive design validation

### 9. Migration Strategy

#### 9.1 Backward Compatibility
- Maintain existing planar slicing functionality
- Gradual migration path for users
- Feature flags for convex slicing rollout

#### 9.2 Data Migration
- Convert existing slice data to new format
- Preserve user preferences and settings
- Handle legacy parameter formats

### 10. Success Metrics

#### 10.1 Technical Metrics
- API response times < 2s for convex slicing
- UI responsiveness < 100ms for parameter changes
- Memory usage optimization for large slice sets

#### 10.2 User Experience Metrics
- Task completion rate for convex slicing workflow
- User satisfaction with physics parameter controls
- Accessibility compliance (WCAG 2.1 AA)

## Conclusion

This integration plan provides a comprehensive approach to incorporating convex-slicing capabilities while maintaining the existing architecture's strengths. The phased implementation ensures minimal disruption to current users while providing advanced features for power users.

The design follows Apple/iOS principles with clean, intuitive interfaces and robust error handling. The modular architecture ensures maintainability and scalability for future enhancements.

**Next Steps:**
1. Review and approve this integration plan
2. Set up development environment for convex-slicing integration
3. Begin Phase 1 implementation with backend API setup
4. Establish testing framework for convex slicing features
