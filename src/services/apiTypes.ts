import type { WorldSpec } from '../shared/schemas/worldSchema';

export interface GenerateWorldRequest {
  transcript: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface GenerateWorldSuccessResponse {
  success: true;
  world: WorldSpec;
  generationTimeMs: number;
  data?: {
    world: WorldSpec;
    generationTimeMs: number;
  };
}

export interface GenerateWorldErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type GenerateWorldApiResponse =
  | GenerateWorldSuccessResponse
  | GenerateWorldErrorResponse;

export interface WorldApiOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  useDevMock?: boolean;
}
