import type { ConvexPhysicsParams } from '../slice/slicingSlice';

export interface ValidationError {
  field: keyof ConvexPhysicsParams;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates physics parameters for convex slicing
 */
export function validatePhysicsParams(params: ConvexPhysicsParams): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Print Head Diameter validation
  if (params.printHeadDiameter <= 0) {
    errors.push({
      field: 'printHeadDiameter',
      message: 'Print head diameter must be greater than 0',
      severity: 'error'
    });
  } else if (params.printHeadDiameter < 0.1) {
    warnings.push({
      field: 'printHeadDiameter',
      message: 'Very small print head diameter may cause issues',
      severity: 'warning'
    });
  } else if (params.printHeadDiameter > 20) {
    warnings.push({
      field: 'printHeadDiameter',
      message: 'Large print head diameter may not be practical',
      severity: 'warning'
    });
  }

  // Rim Start Height validation
  if (params.rimStartHeight <= 0) {
    errors.push({
      field: 'rimStartHeight',
      message: 'Rim start height must be greater than 0',
      severity: 'error'
    });
  } else if (params.rimStartHeight < 0.1) {
    warnings.push({
      field: 'rimStartHeight',
      message: 'Very low rim height may cause overflow',
      severity: 'warning'
    });
  } else if (params.rimStartHeight > 5) {
    warnings.push({
      field: 'rimStartHeight',
      message: 'High rim height may affect meniscus formation',
      severity: 'warning'
    });
  }

  // Contact Angle validation
  if (params.contactAngleDeg < 0 || params.contactAngleDeg > 180) {
    errors.push({
      field: 'contactAngleDeg',
      message: 'Contact angle must be between 0° and 180°',
      severity: 'error'
    });
  } else if (params.contactAngleDeg < 10) {
    warnings.push({
      field: 'contactAngleDeg',
      message: 'Very low contact angle may cause wetting issues',
      severity: 'warning'
    });
  } else if (params.contactAngleDeg > 170) {
    warnings.push({
      field: 'contactAngleDeg',
      message: 'Very high contact angle may cause adhesion issues',
      severity: 'warning'
    });
  }

  // Surface Tension validation
  if (params.surfaceTension <= 0) {
    errors.push({
      field: 'surfaceTension',
      message: 'Surface tension must be greater than 0',
      severity: 'error'
    });
  } else if (params.surfaceTension < 1) {
    warnings.push({
      field: 'surfaceTension',
      message: 'Very low surface tension may cause instability',
      severity: 'warning'
    });
  } else if (params.surfaceTension > 1000) {
    warnings.push({
      field: 'surfaceTension',
      message: 'Very high surface tension may cause computational issues',
      severity: 'warning'
    });
  }

  // Density validation
  if (params.density <= 0) {
    errors.push({
      field: 'density',
      message: 'Density must be greater than 0',
      severity: 'error'
    });
  } else if (params.density < 100) {
    warnings.push({
      field: 'density',
      message: 'Very low density may not be realistic for printing materials',
      severity: 'warning'
    });
  } else if (params.density > 5000) {
    warnings.push({
      field: 'density',
      message: 'Very high density may not be realistic for printing materials',
      severity: 'warning'
    });
  }

  // Gravity validation
  if (params.gravity <= 0) {
    errors.push({
      field: 'gravity',
      message: 'Gravity must be greater than 0',
      severity: 'error'
    });
  } else if (params.gravity < 1) {
    warnings.push({
      field: 'gravity',
      message: 'Very low gravity may cause unrealistic behavior',
      severity: 'warning'
    });
  } else if (params.gravity > 20) {
    warnings.push({
      field: 'gravity',
      message: 'Very high gravity may cause computational issues',
      severity: 'warning'
    });
  }

  // Bézier coefficients validation
  if (params.bezierK1 < 0 || params.bezierK1 > 1) {
    errors.push({
      field: 'bezierK1',
      message: 'Bézier K1 must be between 0 and 1',
      severity: 'error'
    });
  }

  if (params.bezierK2 < 0 || params.bezierK2 > 1) {
    errors.push({
      field: 'bezierK2',
      message: 'Bézier K2 must be between 0 and 1',
      severity: 'error'
    });
  }

  // Cross-parameter validation
  if (params.bezierK1 >= params.bezierK2) {
    warnings.push({
      field: 'bezierK1',
      message: 'Bézier K1 should be less than K2 for proper curve formation',
      severity: 'warning'
    });
  }

  // Physical consistency checks
  const bondNumber = (params.density * params.gravity * Math.pow(params.printHeadDiameter / 2, 2)) / params.surfaceTension;
  if (bondNumber > 1) {
    warnings.push({
      field: 'printHeadDiameter',
      message: `High Bond number (${bondNumber.toFixed(2)}) may cause gravitational effects to dominate`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get parameter suggestions based on material type
 */
export function getParameterSuggestions(materialType: 'water' | 'polymer' | 'bioink' | 'custom'): Partial<ConvexPhysicsParams> {
  switch (materialType) {
    case 'water':
      return {
        surfaceTension: 73.0,
        density: 1000.0,
        contactAngleDeg: 45.0,
      };
    case 'polymer':
      return {
        surfaceTension: 30.0,
        density: 1200.0,
        contactAngleDeg: 60.0,
      };
    case 'bioink':
      return {
        surfaceTension: 50.0,
        density: 1100.0,
        contactAngleDeg: 30.0,
      };
    case 'custom':
    default:
      return {};
  }
}

/**
 * Check if parameters are within typical ranges for bioprinting
 */
export function isWithinTypicalRanges(params: ConvexPhysicsParams): boolean {
  const typicalRanges = {
    printHeadDiameter: [0.1, 2.0],
    rimStartHeight: [0.1, 2.0],
    contactAngleDeg: [10, 120],
    surfaceTension: [10, 100],
    density: [800, 2000],
    gravity: [8, 12],
    bezierK1: [0, 0.5],
    bezierK2: [0.5, 1],
  };

  return Object.entries(typicalRanges).every(([key, [min, max]]) => {
    const value = params[key as keyof ConvexPhysicsParams];
    return value >= min && value <= max;
  });
}
