import { describe, it, expect, beforeEach } from 'vitest';
import { useDreamStore } from './useDreamStore';
import { DEFAULT_MOCK_WORLD } from '../shared/constants';

describe('useDreamStore (Zustand Global State)', () => {
  beforeEach(() => {
    useDreamStore.getState().resetSession();
  });

  it('initializes with clean baseline defaults', () => {
    const state = useDreamStore.getState();
    expect(state.transcript).toBe('');
    expect(state.isListening).toBe(false);
    expect(state.world).toBeNull();
    expect(state.generationStatus).toBe('idle');
    expect(state.generationError).toBeNull();
    expect(state.requestId).toBeNull();
    expect(state.isGameStarted).toBe(false);
    expect(state.playerHealth).toBe(100);
    expect(state.activeEvents).toEqual([]);
  });

  it('updates transcript and clears speech error', () => {
    const store = useDreamStore.getState();
    store.setSpeechError('Microphone blocked');
    expect(useDreamStore.getState().speechError).toBe('Microphone blocked');

    store.setTranscript('A dark fantasy wasteland');
    const updated = useDreamStore.getState();
    expect(updated.transcript).toBe('A dark fantasy wasteland');
    expect(updated.speechError).toBeNull();
  });

  it('transitions generation status and sets world on active requestId', () => {
    const store = useDreamStore.getState();
    const requestId = 'req-123';

    store.beginGeneration(requestId);
    expect(useDreamStore.getState().generationStatus).toBe('generating');
    expect(useDreamStore.getState().requestId).toBe(requestId);

    const committed = store.setWorld(DEFAULT_MOCK_WORLD, requestId);
    expect(committed).toBe(true);
    expect(useDreamStore.getState().generationStatus).toBe('success');
    expect(useDreamStore.getState().world?.id).toBe(DEFAULT_MOCK_WORLD.id);
  });

  it('prevents an older request from overwriting a newer active request (Concurrency Guard)', () => {
    const store = useDreamStore.getState();

    // Request 1 starts
    store.beginGeneration('req-1');
    expect(useDreamStore.getState().requestId).toBe('req-1');

    // Request 2 starts before Request 1 finishes
    store.beginGeneration('req-2');
    expect(useDreamStore.getState().requestId).toBe('req-2');

    // Request 1 finishes late and attempts to write
    const world1 = { ...DEFAULT_MOCK_WORLD, id: 'stale-world-1' };
    const committed1 = store.setWorld(world1, 'req-1');
    expect(committed1).toBe(false);
    expect(useDreamStore.getState().world).toBeNull(); // Not updated!

    // Request 2 finishes and writes
    const world2 = { ...DEFAULT_MOCK_WORLD, id: 'fresh-world-2' };
    const committed2 = store.setWorld(world2, 'req-2');
    expect(committed2).toBe(true);
    expect(useDreamStore.getState().world?.id).toBe('fresh-world-2');
  });

  it('handles failGeneration correctly', () => {
    const store = useDreamStore.getState();
    store.beginGeneration('req-err');

    const handled = store.failGeneration('Gemini rate limited', 'req-err');
    expect(handled).toBe(true);
    expect(useDreamStore.getState().generationStatus).toBe('error');
    expect(useDreamStore.getState().generationError).toBe('Gemini rate limited');
  });

  it('supports independent non-destructive event processing for Person 2 and Person 3', () => {
    const store = useDreamStore.getState();

    // Consumer A (Person 2 tracker)
    const person2ProcessedIds: string[] = [];
    // Consumer B (Person 3 tracker)
    const person3ProcessedIds: string[] = [];

    // Emit event 1
    const evt1 = store.emitEvent({ type: 'item-collected', payload: { itemId: 'crystal-1' } });

    // Both observe without destroying the log
    const eventsSnapshot1 = useDreamStore.getState().activeEvents;
    person2ProcessedIds.push(eventsSnapshot1[0].id);
    person3ProcessedIds.push(eventsSnapshot1[0].id);

    // Emit event 2
    const evt2 = store.emitEvent({ type: 'player-damaged', payload: { amount: 20 } });
    const eventsSnapshot2 = useDreamStore.getState().activeEvents;

    expect(eventsSnapshot2.length).toBe(2);
    expect(eventsSnapshot2[0].id).toBe(evt2.id);
    expect(eventsSnapshot2[1].id).toBe(evt1.id);

    // Verify both consumers saw both events independently
    expect(person2ProcessedIds).toContain(evt1.id);
    expect(person3ProcessedIds).toContain(evt1.id);
  });

  it('resets session cleanly', () => {
    const store = useDreamStore.getState();
    store.setTranscript('something');
    store.beginGeneration('req-1');
    store.setWorld(DEFAULT_MOCK_WORLD, 'req-1');
    store.startGame();
    store.setScore(50);

    store.resetSession();
    const clean = useDreamStore.getState();
    expect(clean.transcript).toBe('');
    expect(clean.world).toBeNull();
    expect(clean.score).toBe(0);
    expect(clean.isGameStarted).toBe(false);
  });
});
