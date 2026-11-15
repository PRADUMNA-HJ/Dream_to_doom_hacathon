import { WorldSpecSchema, type WorldSpec } from '../shared/schemas/worldSchema';
import {
  DEFAULT_MOCK_WORLD,
  CYBERPUNK_ROOFTOP_PRESET_WORLD,
  FLOATING_ISLANDS_PRESET_WORLD,
} from '../shared/constants';
import type {
  GenerateWorldRequest,
  GenerateWorldApiResponse,
  WorldApiOptions,
} from './apiTypes';

export class WorldApiError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'WorldApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Sends a transcript to the /api/generate-world serverless function,
 * parses the response, validates it via Zod, and returns a verified WorldSpec.
 */
export async function generateWorld(
  transcript: string,
  options: WorldApiOptions = {}
): Promise<WorldSpec> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    throw new WorldApiError(
      'Cannot generate world: transcript is empty or contains only whitespace.',
      'INVALID_TRANSCRIPT'
    );
  }

  // Explicit opt-in dev mock (for offline UI & component integration testing)
  if (options.useDevMock) {
    const lower = trimmed.toLowerCase();
    let preset = DEFAULT_MOCK_WORLD;
    if (lower.includes('cyberpunk') || lower.includes('rooftop')) {
      preset = CYBERPUNK_ROOFTOP_PRESET_WORLD;
    } else if (lower.includes('floating') || lower.includes('island')) {
      preset = FLOATING_ISLANDS_PRESET_WORLD;
    }

    return {
      ...preset,
      id: `world-mock-${Date.now()}`,
      title: preset === DEFAULT_MOCK_WORLD ? `Mock: ${trimmed.slice(0, 30)}` : preset.title,
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine external abort signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const payload: GenerateWorldRequest = { transcript: trimmed };

    const response = await fetch('/api/generate-world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      throw new WorldApiError(
        `Server returned non-JSON response (HTTP status ${response.status}).`,
        'MALFORMED_RESPONSE',
        response.status
      );
    }

    if (!response.ok) {
      const errResponse = rawJson as Partial<GenerateWorldApiResponse>;
      if (errResponse && 'error' in errResponse && errResponse.error) {
        throw new WorldApiError(
          errResponse.error.message || 'World generation request failed on server.',
          errResponse.error.code || 'API_ERROR',
          response.status,
          errResponse.error.details
        );
      }

      throw new WorldApiError(
        `World generation endpoint failed with HTTP ${response.status}.`,
        'HTTP_ERROR',
        response.status
      );
    }

    const apiResponse = rawJson as GenerateWorldApiResponse;
    const extractedWorld = apiResponse.success
      ? (apiResponse.world ?? apiResponse.data?.world)
      : null;

    if (!apiResponse.success || !extractedWorld) {
      throw new WorldApiError(
        'Server indicated failure or returned missing world data.',
        'INVALID_API_RESPONSE',
        response.status
      );
    }

    // Strict runtime validation through Zod
    const validationResult = WorldSpecSchema.safeParse(extractedWorld);
    if (!validationResult.success) {
      throw new WorldApiError(
        `Generated scene graph failed schema validation: ${validationResult.error.issues.map((i) => i.message).join('; ')}`,
        'SCHEMA_VALIDATION_FAILED',
        response.status,
        validationResult.error.issues
      );
    }

    return validationResult.data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof WorldApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new WorldApiError(
        `World generation timed out after ${timeoutMs}ms.`,
        'REQUEST_TIMEOUT'
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown network failure';
    throw new WorldApiError(
      `Network failure while contacting /api/generate-world: ${message}`,
      'NETWORK_FAILURE'
    );
  }
}
