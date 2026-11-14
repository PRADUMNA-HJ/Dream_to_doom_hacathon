import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateWorldFromTranscript } from './worldGenerationController';
import { useDreamStore } from '../store/useDreamStore';
import * as worldApi from './worldApi';
import { DEFAULT_MOCK_WORLD } from '../shared/constants';

describe('worldGenerationController', () => {
  beforeEach(() => {
    useDreamStore.getState().resetSession();
    vi.restoreAllMocks();
  });

  it('rejects empty transcript and returns failure', async () => {
    const result = await generateWorldFromTranscript('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('successfully generates world and updates store', async () => {
    vi.spyOn(worldApi, 'generateWorld').mockResolvedValueOnce(DEFAULT_MOCK_WORLD);

    const result = await generateWorldFromTranscript('A tranquil forest');
    expect(result.success).toBe(true);
    expect(result.world?.id).toBe(DEFAULT_MOCK_WORLD.id);
    expect(useDreamStore.getState().generationStatus).toBe('success');
    expect(useDreamStore.getState().world?.id).toBe(DEFAULT_MOCK_WORLD.id);
  });

  it('handles failed generation and records error in store', async () => {
    vi.spyOn(worldApi, 'generateWorld').mockRejectedValueOnce(
      new worldApi.WorldApiError('Rate limited by Gemini', 'RATE_LIMIT')
    );

    const result = await generateWorldFromTranscript('A dark cavern');
    expect(result.success).toBe(false);
    expect(result.error).toContain('RATE_LIMIT');
    expect(useDreamStore.getState().generationStatus).toBe('error');
    expect(useDreamStore.getState().generationError).toContain('Rate limited');
  });

  it('ignores outdated response if another request supersedes it', async () => {
    // Simulate first slow request
    let resolveFirstRequest: (world: typeof DEFAULT_MOCK_WORLD) => void;
    const firstPromise = new Promise<typeof DEFAULT_MOCK_WORLD>((resolve) => {
      resolveFirstRequest = resolve;
    });

    vi.spyOn(worldApi, 'generateWorld')
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({
        ...DEFAULT_MOCK_WORLD,
        id: 'fast-superseding-world',
      });

    // Start request 1 (slow)
    const pendingRequest1 = generateWorldFromTranscript('Slow world');

    // Immediately start request 2 (fast)
    const result2 = await generateWorldFromTranscript('Fast world');
    expect(result2.success).toBe(true);
    expect(useDreamStore.getState().world?.id).toBe('fast-superseding-world');

    // Now resolve request 1 late
    // @ts-expect-error Assigned inside promise constructor
    resolveFirstRequest({
      ...DEFAULT_MOCK_WORLD,
      id: 'stale-slow-world',
    });

    const result1 = await pendingRequest1;
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('ignored');

    // Verify store world was NOT overwritten by stale request 1
    expect(useDreamStore.getState().world?.id).toBe('fast-superseding-world');
  });
});
