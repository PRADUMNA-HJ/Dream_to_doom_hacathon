import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWorld, WorldApiError } from './worldApi';
import { DEFAULT_MOCK_WORLD } from '../shared/constants';

describe('worldApi service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty or whitespace-only transcript', async () => {
    await expect(generateWorld('')).rejects.toThrow(WorldApiError);
    await expect(generateWorld('   ')).rejects.toThrow(/transcript is empty/i);
  });

  it('supports explicit dev mock mode for offline testing', async () => {
    const world = await generateWorld('A peaceful meadow', { useDevMock: true });
    expect(world.id).toContain('world-mock-');
    expect(world.biome).toBe(DEFAULT_MOCK_WORLD.biome);
  });

  it('successfully parses valid API response', async () => {
    const mockResponse = {
      success: true,
      world: DEFAULT_MOCK_WORLD,
      generationTimeMs: 450,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const world = await generateWorld('A magical forest');
    expect(world.id).toBe(DEFAULT_MOCK_WORLD.id);
    expect(world.title).toBe(DEFAULT_MOCK_WORLD.title);
  });

  it('throws WorldApiError on non-200 HTTP response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error' },
      }),
    } as unknown as Response);

    await expect(generateWorld('test')).rejects.toThrow(WorldApiError);
  });

  it('throws WorldApiError on malformed non-JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      },
    } as unknown as Response);

    await expect(generateWorld('test')).rejects.toThrow(/non-JSON response/i);
  });

  it('throws WorldApiError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));

    await expect(generateWorld('test')).rejects.toThrow(/Network failure/i);
  });

  it('throws WorldApiError on request timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          const abortError = new DOMException('The user aborted a request.', 'AbortError');
          setTimeout(() => reject(abortError), 10);
        })
    );

    await expect(generateWorld('test', { timeoutMs: 5 })).rejects.toThrow(/timed out/i);
  });

  it('rejects if returned world fails Zod schema validation', async () => {
    const corruptedWorld = {
      ...DEFAULT_MOCK_WORLD,
      entities: [
        {
          id: 'corrupted',
          asset: 'invalid_nonexistent_asset',
          position: { x: 0, y: 0, z: 0 },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, world: corruptedWorld }),
    } as unknown as Response);

    await expect(generateWorld('test')).rejects.toThrow(/failed schema validation/i);
  });
});
