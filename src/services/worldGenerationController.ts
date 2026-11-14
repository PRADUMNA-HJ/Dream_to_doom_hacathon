import { useDreamStore } from '../store/useDreamStore';
import { generateWorld, WorldApiError } from './worldApi';
import type { WorldSpec } from '../shared/schemas/worldSchema';

export interface ControllerOptions {
  timeoutMs?: number;
  useDevMock?: boolean;
}

export interface GenerationResult {
  success: boolean;
  world?: WorldSpec;
  error?: string;
  requestId: string;
  durationMs: number;
}

/**
 * Controller coordinating the AI Service (/api/generate-world) with the Zustand Store.
 * Handles requestId tracking, concurrency guards, and non-crashing error dispatching.
 */
export async function generateWorldFromTranscript(
  transcript: string,
  options: ControllerOptions = {}
): Promise<GenerationResult> {
  const store = useDreamStore.getState();
  const trimmed = transcript.trim();

  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = performance.now();

  if (!trimmed) {
    const errorMsg = 'Cannot generate world: transcript is empty.';
    store.emitEvent({
      type: 'world-generated',
      payload: { error: errorMsg, status: 'rejected' },
    });
    return {
      success: false,
      error: errorMsg,
      requestId,
      durationMs: 0,
    };
  }

  // Set store state to generating with concurrency lock
  store.beginGeneration(requestId);

  try {
    store.setGenerationStatus('generating');
    const world = await generateWorld(trimmed, {
      timeoutMs: options.timeoutMs,
      useDevMock: options.useDevMock,
    });

    store.setGenerationStatus('validating');

    // Attempt to commit world to store (returns false if an older request finishes after a newer one)
    const committed = store.setWorld(world, requestId);
    const durationMs = Math.round(performance.now() - startTime);

    if (!committed) {
      // Ignored because a subsequent request took precedence
      return {
        success: false,
        error: 'Response ignored: a newer world generation request was initiated.',
        requestId,
        durationMs,
      };
    }

    return {
      success: true,
      world,
      requestId,
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    let errorMessage = 'An unexpected error occurred during world generation.';

    if (err instanceof WorldApiError) {
      errorMessage = `[${err.code}] ${err.message}`;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    store.failGeneration(errorMessage, requestId);

    return {
      success: false,
      error: errorMessage,
      requestId,
      durationMs,
    };
  }
}
