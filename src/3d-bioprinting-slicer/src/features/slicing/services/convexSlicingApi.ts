import { http } from '../../../shared/utils/http';
import type { ConvexPhysicsParams, ConvexSlicingMetadata } from '../slice/slicingSlice';

export interface ConvexSliceRequestBody {
  modelData: File;
  layerHeight: number;
  physicsParams?: Partial<ConvexPhysicsParams>;
  outputFormat?: 'bmp';
  dimensions?: { height?: number; width?: number; depth?: number };
}

export interface ConvexSliceResponseBody {
  slices: string[];
  metadata: ConvexSlicingMetadata;
  compartments?: unknown[];
  jobId?: string;
}

export interface ConvexSliceError {
  type: 'validation' | 'computation' | 'rendering' | 'api';
  message: string;
  details?: {
    parameter?: string;
    value?: any;
    suggestion?: string;
  };
}

/**
 * Submit a convex slicing request to the backend
 */
export async function postConvexSlice(body: ConvexSliceRequestBody, signal?: AbortSignal): Promise<ConvexSliceResponseBody> {
  const form = new FormData();
  form.append('modelData', body.modelData);
  form.append('layerHeight', String(body.layerHeight));
  
  if (body.physicsParams) {
    form.append('physicsParams', JSON.stringify(body.physicsParams));
  }
  
  if (body.outputFormat) {
    form.append('outputFormat', body.outputFormat);
  }

  if (body.dimensions) {
    form.append('dimensions', JSON.stringify(body.dimensions));
  }

  const { data } = await http.post<ConvexSliceResponseBody>('/slice/convex', form, { signal });
  // If immediate result (sync), normalize. Otherwise, only jobId is returned and caller will fetch result.
  if (data && (data as any).metadata) {
    const m = (data as any).metadata as any;
    (data as any).metadata = {
      pitch: m.pitch,
      voxelSize: m.voxel_size,
      numFrames: m.num_frames,
      rimStartHeight: m.rim_start_height,
      printHeadRadius: m.print_head_radius,
      meniscusScale: m.meniscus_scale,
      controlPoints: m.control_points,
      imageWidth: m.image_width,
      imageHeight: m.image_height,
      bitDepth: m.bit_depth,
      colorMode: m.color_mode,
      pixelsPerMm: m.pixels_per_mm,
    } as any;
  }
  return data;
}

/**
 * Get default physics parameters from the backend
 */
export async function getDefaultPhysicsParams(): Promise<ConvexPhysicsParams> {
  const { data } = await http.get<ConvexPhysicsParams>('/slice/convex/parameters/default');
  return data;
}

/**
 * Validate physics parameters
 */
export async function validatePhysicsParams(params: ConvexPhysicsParams): Promise<{ valid: boolean; errors?: string[] }> {
  const { data } = await http.post<{ valid: boolean; errors?: string[] }>('/slice/convex/parameters/validate', params);
  return data;
}

/**
 * Get convex slicing status for a job
 */
export async function getConvexSlicingProgress(jobId: string): Promise<{ progress: number }> {
  const { data } = await http.get<{ progress: number }>(`/slice/convex/progress/${jobId}`);
  return data;
}

export async function getConvexSlicingResult(jobId: string): Promise<{ ready: boolean; slices?: string[]; metadata?: ConvexSlicingMetadata }> {
  const { data } = await http.get<{ ready: boolean; slices?: string[]; metadata?: any }>(`/slice/convex/result/${jobId}`);
  if (data.ready && data.metadata) {
    const m = data.metadata as any;
    data.metadata = {
      pitch: m.pitch,
      voxelSize: m.voxel_size,
      numFrames: m.num_frames,
      rimStartHeight: m.rim_start_height,
      printHeadRadius: m.print_head_radius,
      meniscusScale: m.meniscus_scale,
      controlPoints: m.control_points,
      imageWidth: m.image_width,
      imageHeight: m.image_height,
      bitDepth: m.bit_depth,
      colorMode: m.color_mode,
      pixelsPerMm: m.pixels_per_mm,
    } as any;
  }
  return data as any;
}

/**
 * Delete a convex slicing job on the backend
 */
export async function deleteConvexSlicingJob(jobId: string): Promise<void> {
  await http.delete(`/slice/convex/${jobId}`);
}
