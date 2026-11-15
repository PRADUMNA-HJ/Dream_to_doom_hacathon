import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDreamStore } from '../store/useDreamStore';
import { eventBus } from '../shared/events/eventBus';
import { DEFAULT_MOCK_WORLD } from '../shared/constants';

describe('Phase 2: Complete 3D Gameplay System & Mechanics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    eventBus.clearAllListeners();
    useDreamStore.getState().resetSession();
    useDreamStore.getState().setWorld(DEFAULT_MOCK_WORLD, 'req-gameplay-test');
  });

  describe('Crystal Collection & Score System', () => {
    it('increases score by exactly 10 on collecting a new crystal', () => {
      const store = useDreamStore.getState();
      expect(store.score).toBe(0);
      expect(store.collectedEntityIds).toHaveLength(0);

      const collected = store.collectEntity('entity-crystal-1');
      expect(collected).toBe(true);

      const updated = useDreamStore.getState();
      expect(updated.score).toBe(10);
      expect(updated.collectedEntityIds).toContain('entity-crystal-1');
    });

    it('strictly prevents duplicate crystal collections', () => {
      const store = useDreamStore.getState();

      const firstAttempt = store.collectEntity('entity-crystal-1');
      expect(firstAttempt).toBe(true);
      expect(useDreamStore.getState().score).toBe(10);

      // Attempt duplicate collection of the same crystal
      const secondAttempt = store.collectEntity('entity-crystal-1');
      expect(secondAttempt).toBe(false);
      expect(useDreamStore.getState().score).toBe(10);
      expect(useDreamStore.getState().collectedEntityIds).toHaveLength(1);
    });

    it('accumulates score across multiple distinct crystals', () => {
      const store = useDreamStore.getState();
      store.collectEntity('entity-crystal-1');
      store.collectEntity('entity-crystal-2');
      store.collectEntity('entity-crystal-3');

      const updated = useDreamStore.getState();
      expect(updated.score).toBe(30);
      expect(updated.collectedEntityIds).toHaveLength(3);
      expect(updated.collectedEntityIds).toEqual([
        'entity-crystal-1',
        'entity-crystal-2',
        'entity-crystal-3',
      ]);
    });

    it('records item-collected event in store activeEvents on collection', () => {
      useDreamStore.getState().collectEntity('entity-crystal-4');

      const events = useDreamStore.getState().activeEvents;
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].type).toBe('item-collected');
      expect(events[0].payload).toEqual({
        entityId: 'entity-crystal-4',
        points: 10,
      });
    });

    it('propagates item-collected through EventBus when published by 3D interactions', () => {
      const collectedEvents: unknown[] = [];
      eventBus.subscribe('item-collected', (event) => {
        collectedEvents.push(event.payload);
      });

      eventBus.publish({
        type: 'item-collected',
        payload: { entityId: 'entity-crystal-4', asset: 'crystal', points: 10 },
      });

      expect(collectedEvents).toHaveLength(1);
      expect(collectedEvents[0]).toEqual({
        entityId: 'entity-crystal-4',
        asset: 'crystal',
        points: 10,
      });
    });
  });

  describe('Hazard & Damage System', () => {
    it('reduces player health by specified damage amount', () => {
      const store = useDreamStore.getState();
      expect(store.playerHealth).toBe(100);

      store.setPlayerHealth((prev) => prev - 15);
      expect(useDreamStore.getState().playerHealth).toBe(85);

      store.setPlayerHealth((prev) => prev - 25);
      expect(useDreamStore.getState().playerHealth).toBe(60);
    });

    it('clamps health to 0 and disallows negative health values', () => {
      const store = useDreamStore.getState();
      store.setPlayerHealth(20);

      store.setPlayerHealth((prev) => prev - 50);
      expect(useDreamStore.getState().playerHealth).toBe(0);
    });

    it('triggers game-over event and disables isGameStarted when health reaches 0', () => {
      const gameOverEvents: unknown[] = [];
      eventBus.subscribe('game-over', (event) => {
        gameOverEvents.push(event);
      });

      const store = useDreamStore.getState();
      store.setPlayerHealth(0);

      const updated = useDreamStore.getState();
      expect(updated.playerHealth).toBe(0);
      expect(updated.isGameStarted).toBe(false);
      expect(updated.activeEvents.some((e) => e.type === 'game-over')).toBe(true);
    });

    it('ignores further damage applications when player is already at 0 health', () => {
      const store = useDreamStore.getState();
      store.setPlayerHealth(0);

      // Attempt additional damage after death
      store.setPlayerHealth((prev) => prev - 20);
      expect(useDreamStore.getState().playerHealth).toBe(0);
    });
  });

  describe('Portal & Teleportation Handling', () => {
    it('handles portal-entered event delivery with target coordinates', () => {
      let teleportTarget: unknown = null;
      eventBus.subscribe('portal-entered', (event) => {
        teleportTarget = event.payload?.destination;
      });

      const destination = { x: 0, y: 3.5, z: -16 };
      eventBus.publish({
        type: 'portal-entered',
        payload: { entityId: 'entity-portal-1', destination },
      });

      expect(teleportTarget).toEqual(destination);
    });
  });

  describe('Game Restart & State Reset Consistency', () => {
    it('restartGame restores full health, clears collected crystals, and resets score', () => {
      const store = useDreamStore.getState();
      store.collectEntity('entity-crystal-1');
      store.collectEntity('entity-crystal-2');
      store.setPlayerHealth(40);

      expect(useDreamStore.getState().score).toBe(20);
      expect(useDreamStore.getState().collectedEntityIds).toHaveLength(2);

      // Perform restart
      store.restartGame();

      const restarted = useDreamStore.getState();
      expect(restarted.playerHealth).toBe(100);
      expect(restarted.score).toBe(0);
      expect(restarted.collectedEntityIds).toHaveLength(0);
      expect(restarted.isGameStarted).toBe(true);
      expect(restarted.isPaused).toBe(false);
      expect(restarted.lifecyclePhase).toBe('ready');

      // Verify restart event published
      expect(restarted.activeEvents.some((e) => e.type === 'game-started')).toBe(true);
    });

    it('resetGame restores baseline state to idle', () => {
      const store = useDreamStore.getState();
      store.collectEntity('entity-crystal-1');
      store.resetGame();

      const resetState = useDreamStore.getState();
      expect(resetState.score).toBe(0);
      expect(resetState.playerHealth).toBe(100);
      expect(resetState.collectedEntityIds).toHaveLength(0);
      expect(resetState.isGameStarted).toBe(false);
      expect(resetState.lifecyclePhase).toBe('idle');
    });
  });
});
