import { GoogleGenAI } from '@google/genai';
import { ApiServerError } from './apiErrors';

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Validates and retrieves server-side Gemini configuration.
 * Never exposes the API key to the client.
 */
export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_secret_gemini_api_key')) {
    throw new ApiServerError(
      'MISSING_API_KEY',
      'Server configuration error: GEMINI_API_KEY is missing or invalid on the server.',
      500
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  return { apiKey: apiKey.trim(), model: model.trim() };
}

/**
 * Returns a cached GoogleGenAI instance for the current serverless container.
 * Recreates the client only if the API key has changed.
 */
export function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const config = getGeminiConfig();

  if (!cachedClient || cachedApiKey !== config.apiKey) {
    cachedClient = new GoogleGenAI({ apiKey: config.apiKey });
    cachedApiKey = config.apiKey;
  }

  return { client: cachedClient, model: config.model };
}

/**
 * Utility for tests to reset cached singleton or inject mock client.
 */
export function setCachedGeminiClientForTest(client: GoogleGenAI | null): void {
  cachedClient = client;
  cachedApiKey = client ? 'test-api-key' : null;
}
