/**
 * Standardized server-side error class for Dream-to-Doom AI pipeline.
 */
export type ApiErrorCode =
  | 'INVALID_METHOD'
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_REQUEST'
  | 'TRANSCRIPT_TOO_LONG'
  | 'MISSING_API_KEY'
  | 'MODEL_CONFIGURATION_ERROR'
  | 'RATE_LIMITED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'INVALID_AI_RESPONSE'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'INTERNAL_SERVER_ERROR';

export class ApiServerError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiServerError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Maps upstream SDK/Network errors into typed ApiServerErrors.
 */
export function mapUpstreamError(error: unknown): ApiServerError {
  if (error instanceof ApiServerError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Rate limits / quota exhaustion
  if (message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate limit')) {
    return new ApiServerError(
      'RATE_LIMITED',
      'The Gemini API rate limit or quota has been reached. Please try again shortly.',
      429
    );
  }

  // Authentication / API Key issues
  if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key') || message.toLowerCase().includes('unauthorized')) {
    return new ApiServerError(
      'MISSING_API_KEY',
      'Gemini API authentication failed. Verify server-side GEMINI_API_KEY configuration.',
      401
    );
  }

  // Model not found or unsupported
  if (message.includes('404') || message.toLowerCase().includes('not found') || message.toLowerCase().includes('model')) {
    return new ApiServerError(
      'MODEL_CONFIGURATION_ERROR',
      `The configured Gemini model is unavailable or unrecognized. Check GEMINI_MODEL setting.`,
      500
    );
  }

  // Timeouts
  if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')) {
    return new ApiServerError(
      'AI_TIMEOUT',
      'Gemini generation request timed out.',
      504
    );
  }

  // Service unavailable
  if (message.includes('503') || message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('overloaded')) {
    return new ApiServerError(
      'AI_SERVICE_UNAVAILABLE',
      'The Gemini AI service is currently unavailable or experiencing high load.',
      503
    );
  }

  return new ApiServerError(
    'INTERNAL_SERVER_ERROR',
    `An unexpected error occurred during world generation: ${message}`,
    500
  );
}
