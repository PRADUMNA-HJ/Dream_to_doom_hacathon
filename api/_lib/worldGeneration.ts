import { getGeminiClient } from './geminiClient';
import { SYSTEM_INSTRUCTION, buildUserPrompt, WORLD_SPEC_JSON_SCHEMA } from './worldPrompt';
import { ApiServerError, mapUpstreamError } from './apiErrors';
import { WorldSpecSchema, type WorldSpec } from '../../src/shared/schemas/worldSchema';
import type { GoogleGenAI } from '@google/genai';

export interface WorldGenerationOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  customClient?: GoogleGenAI;
  customModel?: string;
}

export interface GeneratedWorldResult {
  world: WorldSpec;
  generationTimeMs: number;
}

/**
 * Requests a validated 3D Scene Graph from Google Gemini.
 * Measures server generation time, parses structured JSON, and enforces Zod validation.
 */
export async function generateWorldFromPrompt(
  transcript: string,
  options: WorldGenerationOptions = {}
): Promise<GeneratedWorldResult> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    throw new ApiServerError('INVALID_REQUEST', 'Transcript must not be empty.', 400);
  }

  if (trimmed.length > 600) {
    throw new ApiServerError(
      'TRANSCRIPT_TOO_LONG',
      `Transcript length (${trimmed.length}) exceeds maximum limit of 600 characters.`,
      400
    );
  }

  const { client, model } = options.customClient
    ? { client: options.customClient, model: options.customModel || 'gemini-3.8-flash' }
    : getGeminiClient();

  const userPrompt = buildUserPrompt(trimmed);
  const startTime = performance.now();

  try {
    const response = await client.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: WORLD_SPEC_JSON_SCHEMA as any,
        temperature: 0.35,
        maxOutputTokens: 2500,
        abortSignal: options.signal,
      },
    });

    const generationTimeMs = Math.round(performance.now() - startTime);

    const rawText = response.text;
    if (!rawText || rawText.trim() === '') {
      throw new ApiServerError(
        'INVALID_AI_RESPONSE',
        'Gemini returned an empty or whitespace response.',
        502
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText.trim());
    } catch (parseErr) {
      throw new ApiServerError(
        'INVALID_AI_RESPONSE',
        `Failed to parse Gemini response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
        502,
        { rawPreview: rawText.slice(0, 200) }
      );
    }

    // Full runtime schema validation through Zod
    const validationResult = WorldSpecSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const issueSummary = validationResult.error.issues
        .map((i) => `[${i.path.join('.')}]: ${i.message}`)
        .join('; ');

      throw new ApiServerError(
        'SCHEMA_VALIDATION_FAILED',
        `Generated Scene Graph failed runtime contract validation: ${issueSummary}`,
        502,
        validationResult.error.issues
      );
    }

    return {
      world: validationResult.data,
      generationTimeMs,
    };
  } catch (error: unknown) {
    throw mapUpstreamError(error);
  }
}
