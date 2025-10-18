import { http } from '../../../shared/utils/http';

export interface GenerateRequestBody {
  layout: unknown;
}

export interface GenerateResponseBody {
  script: string;
}

export async function postGenerateScript(body: GenerateRequestBody): Promise<GenerateResponseBody> {
  const { data } = await http.post<GenerateResponseBody>('/generate-script', body);
  return data;
}


