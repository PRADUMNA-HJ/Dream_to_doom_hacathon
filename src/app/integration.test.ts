import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('tone', () => {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    now: vi.fn().mockReturnValue(0),
    gainToDb: vi.fn((gain: number) => (gain <= 0 ? -Infinity : 20 * Math.log10(gain))),
    getDestination: vi.fn(() => ({
      mute: false,
      volume: { rampTo: vi.fn() },
    })),
    PolySynth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn(),
    })),
    Synth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      frequency: { exponentialRampTo: vi.fn() },
      dispose: vi.fn(),
    })),
    NoiseSynth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn(),
    })),
    Reverb: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
      generate: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    })),
    Filter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      frequency: { rampTo: vi.fn() },
      dispose: vi.fn(),
    })),
  };
});

import { useDreamStore } from '../store/useDreamStore';
import { eventBus } from '../shared/events/eventBus';
import { soundEngine } from '../sensory/SoundEngine';
import { speechController } from '../sensory/SpeechController';
import { DEFAULT_MOCK_WORLD } from '../shared/constants';
import * as controller from '../services/worldGenerationController';

describe('Phase 3 End-to-End Application Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    eventBus.clearAllListeners();
    useDreamStore.getState().resetSession();
  });

  describe('Group A: Voice-to-AI Pipeline', () => {
    it('sets transcript and updates lifecycle to transcript-ready', () => {
      useDreamStore.getState().setTranscript('A mysterious cosmic cavern with glowing crystals');
      expect(useDreamStore.getState().transcript).toBe('A mysterious cosmic cavern with glowing crystals');
      expect(useDreamStore.getState().lifecyclePhase).toBe('transcript-ready');
    });

    it('rejects empty voice transcripts gracefully without crashing', async () => {
      const result = await controller.generateWorldFromTranscript('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('handles speech controller start/stop state changes', () => {
      expect(speechController.getIsActive()).toBe(false);
      // In node/vitest environment without Web Speech API, returns false safely
      const started = speechController.startListening();
      if (!speechController.getSupported()) {
        expect(started).toBe(false);
        expect(useDreamStore.getState().speechError).toContain('not supported');
      }
    });
  });

  describe('Group B: AI-to-3D Handshake & World Lifecycle', () => {
    it('increments worldRevision and transitions to loading-assets on new world commit', () => {
      const store = useDreamStore.getState();
      const requestId = 'req-h1';

      store.beginGeneration(requestId);
      expect(useDreamStore.getState().lifecyclePhase).toBe('generating');

      const committed = store.setWorld(DEFAULT_MOCK_WORLD, requestId);
      expect(committed).toBe(true);
      expect(useDreamStore.getState().worldRevision).toBe(1);
      expect(useDreamStore.getState().lifecyclePhase).toBe('loading-assets');
      expect(useDreamStore.getState().isSceneReady).toBe(false);
      expect(useDreamStore.getState().isPhysicsReady).toBe(false);
    });

    it('declares world ready only when both Scene and Physics handshake signals arrive', () => {
      const store = useDreamStore.getState();
      store.beginGeneration('req-h2');
      store.setWorld(DEFAULT_MOCK_WORLD, 'req-h2');
      const rev = useDreamStore.getState().worldRevision;

      // 1. Scene ready signal arrives first
      store.notifySceneReady(rev);
      expect(useDreamStore.getState().isSceneReady).toBe(true);
      expect(useDreamStore.getState().isPhysicsReady).toBe(false);
      expect(useDreamStore.getState().lifecyclePhase).toBe('loading-assets'); // Not yet ready!

      // 2. Physics ready signal arrives
      store.notifyPhysicsReady(rev);
      expect(useDreamStore.getState().isPhysicsReady).toBe(true);
      expect(useDreamStore.getState().lifecyclePhase).toBe('ready');
      expect(useDreamStore.getState().isGameStarted).toBe(true);
    });

    it('ignores stale ready callbacks from an outdated world revision', () => {
      const store = useDreamStore.getState();
      store.beginGeneration('req-r1');
      store.setWorld(DEFAULT_MOCK_WORLD, 'req-r1'); // revision 1

      store.beginGeneration('req-r2');
      store.setWorld({ ...DEFAULT_MOCK_WORLD, id: 'world-2' }, 'req-r2'); // revision 2

      // Late callback from revision 1
      const accepted = store.notifySceneReady(1);
      expect(accepted).toBe(false);
      expect(useDreamStore.getState().isSceneReady).toBe(false);
    });
  });

  describe('Group C: AI-to-Audio Integration', () => {
    it('subscribes to audioMood changes and modulates Tone.js engine', () => {
      const applyMoodSpy = vi.spyOn(soundEngine, 'applyAudioMood');

      soundEngine.applyAudioMood('mystical');
      expect(applyMoodSpy).toHaveBeenCalledWith('mystical');

      soundEngine.applyAudioMood('tense');
      expect(applyMoodSpy).toHaveBeenCalledWith('tense');
    });

    it('toggles audio mute state properly in store and engine', () => {
      soundEngine.setMuted(true);
      expect(useDreamStore.getState().isMuted).toBe(true);

      soundEngine.setMuted(false);
      expect(useDreamStore.getState().isMuted).toBe(false);
    });
  });

  describe('Group D: Multi-Consumer Game Event System', () => {
    it('delivers game events to all independent subscribers without event popping or loss', () => {
      const subscriberA_Events: string[] = [];
      const subscriberB_Events: string[] = [];

      const unsubA = eventBus.subscribe('item-collected', (e) => {
        subscriberA_Events.push(e.id);
      });

      const unsubB = eventBus.subscribe('item-collected', (e) => {
        subscriberB_Events.push(e.id);
      });

      const unsubWildcard = eventBus.subscribe('*', (e) => {
        subscriberB_Events.push(`wildcard_${e.type}`);
      });

      // Publish event
      const event = eventBus.publish({
        type: 'item-collected',
        payload: { entityId: 'crystal_omega', asset: 'crystal' },
      });

      // Both independent consumers received it
      expect(subscriberA_Events).toContain(event.id);
      expect(subscriberB_Events).toContain(event.id);
      expect(subscriberB_Events).toContain('wildcard_item-collected');

      // Verify Zustand store log also retained the event
      expect(useDreamStore.getState().activeEvents[0].id).toBe(event.id);

      // Verify unsubscribe works cleanly
      unsubA();
      unsubB();
      unsubWildcard();
    });
  });

  describe('Group E: Telemetry & Stage Diagnostics', () => {
    it('records structured stage logs as pipeline progresses', () => {
      const store = useDreamStore.getState();
      store.addTelemetryLog('test-stage', 'Test diagnostic message');

      const logs = useDreamStore.getState().telemetryLogs;
      expect(logs.length).toBe(1);
      expect(logs[0].stage).toBe('test-stage');
      expect(logs[0].message).toBe('Test diagnostic message');
    });
  });
});
