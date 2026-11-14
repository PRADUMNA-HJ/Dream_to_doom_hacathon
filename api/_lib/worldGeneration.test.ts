import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWorldFromPrompt } from './worldGeneration';
import { ApiServerError } from './apiErrors';
import { DEFAULT_MOCK_WORLD } from '../../src/shared/constants';
import type { GoogleGenAI } from '@google/genai';

describe('worldGeneration service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  });

  it('rejects empty or whitespace-only transcript', async () => {
    await expect(generateWorldFromPrompt('')).rejects.toThrow(ApiServerError);
    await expect(generateWorldFromPrompt('   ')).rejects.toThrow(/Transcript must not be empty/i);
  });

  it('rejects transcripts exceeding 600 characters', async () => {
    const longPrompt = 'a'.repeat(601);
    await expect(generateWorldFromPrompt(longPrompt)).rejects.toThrow(ApiServerError);
    await expect(generateWorldFromPrompt(longPrompt)).rejects.toThrow(/exceeds maximum limit of 600/i);
  });

  it('throws MISSING_API_KEY if GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(generateWorldFromPrompt('A peaceful forest')).rejects.toThrow(ApiServerError);
    try {
      await generateWorldFromPrompt('A peaceful forest');
    } catch (err) {
      expect((err as ApiServerError).code).toBe('MISSING_API_KEY');
      expect((err as ApiServerError).status).toBe(500);
    }
  });

  it('successfully generates and validates WorldSpec from structured Gemini JSON', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValueOnce({
          text: JSON.stringify(DEFAULT_MOCK_WORLD),
        }),
      },
    } as unknown as GoogleGenAI;

    const result = await generateWorldFromPrompt('A peaceful meadow with crystals', {
      customClient: mockClient,
    });

    expect(result.world.id).toBe(DEFAULT_MOCK_WORLD.id);
    expect(result.world.biome).toBe(DEFAULT_MOCK_WORLD.biome);
    expect(result.generationTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('throws INVALID_AI_RESPONSE on empty or null response text', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValueOnce({
          text: '',
        }),
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateWorldFromPrompt('A dark cave', { customClient: mockClient })
    ).rejects.toThrow(/empty or whitespace response/i);
  });

  it('throws INVALID_AI_RESPONSE on malformed JSON response', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValueOnce({
          text: '{"title": "Unfinished JSON...',
        }),
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateWorldFromPrompt('A dark cave', { customClient: mockClient })
    ).rejects.toThrow(/Failed to parse Gemini response as JSON/i);
  });

  it('throws SCHEMA_VALIDATION_FAILED if generated JSON violates WorldSpec contract', async () => {
    const invalidWorld = {
      ...DEFAULT_MOCK_WORLD,
      biome: 'invalid_biome_not_supported',
    };

    const mockClient = {
      models: {
        generateContent: vi.fn().mockResolvedValueOnce({
          text: JSON.stringify(invalidWorld),
        }),
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateWorldFromPrompt('A dark cave', { customClient: mockClient })
    ).rejects.toThrow(/failed runtime contract validation/i);
  });

  it('maps upstream rate limit errors (429) to RATE_LIMITED status 429', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockRejectedValueOnce(new Error('Resource has been exhausted (e.g. check quota) 429')),
      },
    } as unknown as GoogleGenAI;

    try {
      await generateWorldFromPrompt('Test', { customClient: mockClient });
    } catch (err) {
      expect((err as ApiServerError).code).toBe('RATE_LIMITED');
      expect((err as ApiServerError).status).toBe(429);
    }
  });

  it('maps upstream timeout errors to AI_TIMEOUT status 504', async () => {
    const mockClient = {
      models: {
        generateContent: vi.fn().mockRejectedValueOnce(new Error('Operation was aborted due to timeout')),
      },
    } as unknown as GoogleGenAI;

    try {
      await generateWorldFromPrompt('Test', { customClient: mockClient });
    } catch (err) {
      expect((err as ApiServerError).code).toBe('AI_TIMEOUT');
      expect((err as ApiServerError).status).toBe(504);
    }
  });
});
