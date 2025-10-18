import { http } from '../../../shared/utils/http';

export interface SliceRequestBody {
  modelData: File;
  layerHeight: number;
}

export interface SliceResponseBody {
  slices: string[];
  compartments?: unknown[];
}

export async function postSlice(body: SliceRequestBody): Promise<SliceResponseBody> {
  const form = new FormData();
  form.append('modelData', body.modelData);
  form.append('layerHeight', String(body.layerHeight));
  const { data } = await http.post<SliceResponseBody>('/slice', form);
  return data;
}


