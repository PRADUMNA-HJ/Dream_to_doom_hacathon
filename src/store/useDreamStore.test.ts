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

  it('manages single-crystal collection and prevents duplicate scoring (Part 8 & 15.D)', () => {
    const store = useDreamStore.getState();
    expect(store.score).toBe(0);
    expect(store.collectedEntityIds).toEqual([]);

    // First collection of crystal-1: awards +10 points
    const collected1 = store.collectEntity('crystal-1');
    expect(collected1).toBe(true);
    expect(useDreamStore.getState().score).toBe(10);
    expect(useDreamStore.getState().collectedEntityIds).toContain('crystal-1');

    // Duplicate collection attempt of crystal-1: must be rejected
    const duplicate = store.collectEntity('crystal-1');
    expect(duplicate).toBe(false);
    expect(useDreamStore.getState().score).toBe(10); // Still 10, no double scoring!

    // Collection of another crystal-2: awards another +10 points
    const collected2 = store.collectEntity('crystal-2');
    expect(collected2).toBe(true);
    expect(useDreamStore.getState().score).toBe(20);
    expect(useDreamStore.getState().collectedEntityIds).toEqual(['crystal-1', 'crystal-2']);
  });

  it('clamps health >= 0, prevents damage when dead, and triggers game-over (Part 11, 12, 15.E)', () => {
    const store = useDreamStore.getState();
    expect(store.playerHealth).toBe(100);

    // Initial damage
    store.setPlayerHealth((h) => h - 40);
    expect(useDreamStore.getState().playerHealth).toBe(60);

    // Lethal damage: clamps to 0 (never negative)
    store.setPlayerHealth((h) => h - 80);
    expect(useDreamStore.getState().playerHealth).toBe(0);
    expect(useDreamStore.getState().isGameStarted).toBe(false);

    // Verify game-over event was emitted
    const events = useDreamStore.getState().activeEvents;
    expect(events.some((e) => e.type === 'game-over')).toBe(true);

    // Attempting further damage while dead is rejected
    store.setPlayerHealth((h) => h - 50);
    expect(useDreamStore.getState().playerHealth).toBe(0);
  });

  it('handles restartGame by resetting health, score, and collected entities', () => {
    const store = useDreamStore.getState();
    store.collectEntity('crystal-1');
    store.setPlayerHealth(0);
    expect(useDreamStore.getState().playerHealth).toBe(0);

    store.restartGame();
    const restarted = useDreamStore.getState();
    expect(restarted.playerHealth).toBe(100);
    expect(restarted.score).toBe(0);
    expect(restarted.collectedEntityIds).toEqual([]);
    expect(restarted.isGameStarted).toBe(true);
  });

  it('manages 10-second cinematic video showcase state and dual mode switching', () => {
    const store = useDreamStore.getState();
    expect(store.viewMode).toBe('cinematic');
    expect(store.cinematicProgress).toBe(0);
    expect(store.isCinematicPlaying).toBe(true);
    expect(store.cinematicDuration).toBe(10);

    // Progress updates
    store.setCinematicProgress(4.5);
    expect(useDreamStore.getState().cinematicProgress).toBe(4.5);

    // Clamps within [0, 10]
    store.setCinematicProgress(15);
    expect(useDreamStore.getState().cinematicProgress).toBe(10);
    store.setCinematicProgress(-5);
    expect(useDreamStore.getState().cinematicProgress).toBe(0);

    // Dual Mode switching
    store.setViewMode('interactive');
    expect(useDreamStore.getState().viewMode).toBe('interactive');

    // Restart cinematic resets progress and switches back to cinematic mode
    store.setCinematicProgress(9.2);
    store.restartCinematic();
    const restarted = useDreamStore.getState();
    expect(restarted.viewMode).toBe('cinematic');
    expect(restarted.cinematicProgress).toBe(0);
    expect(restarted.isCinematicPlaying).toBe(true);
  });
});
