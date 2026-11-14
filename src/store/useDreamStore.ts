import { create } from 'zustand';
import type { WorldSpec, GameEvent, GameEventType } from '../shared/schemas/worldSchema';

export type GenerationStatus = 'idle' | 'generating' | 'validating' | 'success' | 'error';

export type LifecyclePhase =
  | 'idle'
  | 'listening'
  | 'transcript-ready'
  | 'generating'
  | 'validating'
  | 'loading-assets'
  | 'initializing-scene'
  | 'initializing-physics'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'error';

export interface TelemetryLogItem {
  id: string;
  timestamp: number;
  stage: string;
  message: string;
}

export interface VoiceInputState {
  transcript: string;
  isListening: boolean;
  speechError: string | null;
}

export interface WorldGenerationState {
  world: WorldSpec | null;
  worldRevision: number;
  generationStatus: GenerationStatus;
  lifecyclePhase: LifecyclePhase;
  generationError: string | null;
  requestId: string | null;
  generationStartedAt: number | null;
  generationCompletedAt: number | null;
  serverGenerationTimeMs: number | null;
  isSceneReady: boolean;
  isPhysicsReady: boolean;
  telemetryLogs: TelemetryLogItem[];
}

export interface GameplayState {
  isGameStarted: boolean;
  isPaused: boolean;
  score: number;
  playerHealth: number;
  collectedEntityIds: string[];
}

export interface AudioSystemState {
  isAudioInitialized: boolean;
  isMuted: boolean;
  audioVolume: number;
}

export interface DreamStoreState
  extends VoiceInputState,
    WorldGenerationState,
    GameplayState,
    AudioSystemState {
  // Bounded event log (non-destructive for multiple consumers)
  activeEvents: GameEvent[];

  // Voice Input Actions (Person 3)
  setTranscript: (transcript: string) => void;
  setListening: (isListening: boolean) => void;
  setSpeechError: (error: string | null) => void;
  clearTranscript: () => void;

  // World Generation & Lifecycle Actions
  beginGeneration: (requestId: string) => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setLifecyclePhase: (phase: LifecyclePhase) => void;
  setWorld: (world: WorldSpec, responseRequestId: string, serverGenerationTimeMs?: number) => boolean;
  failGeneration: (error: string, responseRequestId: string) => boolean;
  resetGeneration: () => void;

  // Handshake signals from 3D & Physics (Person 2)
  notifySceneReady: (revision: number) => boolean;
  notifyPhysicsReady: (revision: number) => boolean;

  // Telemetry & Stage Logging
  addTelemetryLog: (stage: string, message: string) => void;
  clearTelemetryLogs: () => void;

  // Audio Controls (Person 3)
  setAudioInitialized: (initialized: boolean) => void;
  setMuted: (muted: boolean) => void;
  setAudioVolume: (volume: number) => void;

  // Gameplay Actions (Person 2 / Integrator)
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPlayerHealth: (health: number | ((prev: number) => number)) => void;
  collectEntity: (entityId: string) => boolean;
  restartGame: () => void;
  resetGame: () => void;

  // Multi-Consumer Event System
  emitEvent: (
    event: Omit<GameEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ) => GameEvent;
  clearEvents: () => void;

  // Session Management
  resetWorld: () => void;
  resetSession: () => void;
}

const MAX_EVENT_LOG_SIZE = 50;
const MAX_TELEMETRY_LOG_SIZE = 50;

export const useDreamStore = create<DreamStoreState>((set, get) => ({
  // Voice Input State
  transcript: '',
  isListening: false,
  speechError: null,

  // World Generation State
  world: null,
  worldRevision: 0,
  generationStatus: 'idle',
  lifecyclePhase: 'idle',
  generationError: null,
  requestId: null,
  generationStartedAt: null,
  generationCompletedAt: null,
  serverGenerationTimeMs: null,
  isSceneReady: false,
  isPhysicsReady: false,
  telemetryLogs: [],

  // Gameplay State
  isGameStarted: false,
  isPaused: false,
  score: 0,
  playerHealth: 100,
  collectedEntityIds: [],

  // Audio System State
  isAudioInitialized: false,
  isMuted: false,
  audioVolume: 0.75,

  // Event Log
  activeEvents: [],

  // Voice Input Actions
  setTranscript: (transcript) =>
    set({
      transcript,
      speechError: null,
      lifecyclePhase: transcript.trim().length > 0 ? 'transcript-ready' : 'idle',
    }),

  setListening: (isListening) =>
    set((state) => ({
      isListening,
      lifecyclePhase: isListening ? 'listening' : state.lifecyclePhase,
    })),

  setSpeechError: (speechError) =>
    set({
      speechError,
      isListening: false,
      lifecyclePhase: speechError ? 'error' : 'idle',
    }),

  clearTranscript: () => set({ transcript: '', lifecyclePhase: 'idle' }),

  // World Generation Actions with Concurrency Protection
  beginGeneration: (requestId) => {
    const startedAt = Date.now();
    get().addTelemetryLog('generation-request-started', 'Sending Scene Graph generation request...');

    set({
      requestId,
      generationStatus: 'generating',
      lifecyclePhase: 'generating',
      generationError: null,
      generationStartedAt: startedAt,
      generationCompletedAt: null,
      isSceneReady: false,
      isPhysicsReady: false,
    });
  },

  setGenerationStatus: (generationStatus) =>
    set((state) => ({
      generationStatus,
      lifecyclePhase:
        generationStatus === 'generating'
          ? 'generating'
          : generationStatus === 'validating'
          ? 'validating'
          : generationStatus === 'error'
          ? 'error'
          : state.lifecyclePhase,
    })),

  setLifecyclePhase: (lifecyclePhase) => set({ lifecyclePhase }),

  setWorld: (world, responseRequestId, serverGenerationTimeMs) => {
    const currentRequestId = get().requestId;
    if (responseRequestId !== currentRequestId) {
      return false;
    }

    const nextRevision = get().worldRevision + 1;
    get().addTelemetryLog('ai-response-received', `World generated: "${world.title}" (${world.biome}).`);
    get().addTelemetryLog('schema-validation-completed', `Scene graph validated with ${world.entities.length} entities.`);
    get().addTelemetryLog('loading-assets', 'Hydrating 3D primitives and colliders...');

    set({
      world,
      worldRevision: nextRevision,
      generationStatus: 'success',
      lifecyclePhase: 'loading-assets',
      generationError: null,
      generationCompletedAt: Date.now(),
      serverGenerationTimeMs: serverGenerationTimeMs ?? null,
      collectedEntityIds: [],
      isSceneReady: false,
      isPhysicsReady: false,
    });

    // Automatically emit event for Person 2 and Person 3
    get().emitEvent({
      type: 'world-generated' as GameEventType,
      payload: { worldId: world.id, title: world.title, biome: world.biome, revision: nextRevision },
    });

    return true;
  },

  failGeneration: (error, responseRequestId) => {
    const currentRequestId = get().requestId;
    if (responseRequestId !== currentRequestId) {
      return false;
    }

    get().addTelemetryLog('generation-failed', `Generation error: ${error}`);

    set({
      generationStatus: 'error',
      lifecyclePhase: 'error',
      generationError: error,
      generationCompletedAt: Date.now(),
    });

    return true;
  },

  resetGeneration: () =>
    set({
      generationStatus: 'idle',
      lifecyclePhase: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
      isSceneReady: false,
      isPhysicsReady: false,
    }),

  // Handshake signals from 3D & Physics (Person 2)
  notifySceneReady: (revision) => {
    if (revision !== get().worldRevision) return false;
    get().addTelemetryLog('scene-mounted', '3D Scene Canvas mounted and rendered.');
    set({ isSceneReady: true });

    if (get().isPhysicsReady) {
      get().addTelemetryLog('world-ready', 'Exploration ready. Collision hulls initialized.');
      set({ lifecyclePhase: 'ready', isGameStarted: true });
    }
    return true;
  },

  notifyPhysicsReady: (revision) => {
    if (revision !== get().worldRevision) return false;
    get().addTelemetryLog('physics-ready', 'Rapier physics world initialized.');
    set({ isPhysicsReady: true });

    if (get().isSceneReady) {
      get().addTelemetryLog('world-ready', 'Exploration ready. Collision hulls initialized.');
      set({ lifecyclePhase: 'ready', isGameStarted: true });
    }
    return true;
  },

  // Telemetry Log System
  addTelemetryLog: (stage, message) => {
    const newLog: TelemetryLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      stage,
      message,
    };

    set((state) => ({
      telemetryLogs: [newLog, ...state.telemetryLogs].slice(0, MAX_TELEMETRY_LOG_SIZE),
    }));
  },

  clearTelemetryLogs: () => set({ telemetryLogs: [] }),

  // Audio System Actions
  setAudioInitialized: (isAudioInitialized) => set({ isAudioInitialized }),
  setMuted: (isMuted) => set({ isMuted }),
  setAudioVolume: (audioVolume) => set({ audioVolume: Math.max(0, Math.min(1, audioVolume)) }),

  // Gameplay Actions
  startGame: () =>
    set({
      isGameStarted: true,
      isPaused: false,
      playerHealth: 100,
      score: 0,
      lifecyclePhase: 'playing',
    }),

  pauseGame: () => set({ isPaused: true, lifecyclePhase: 'paused' }),
  resumeGame: () => set({ isPaused: false, lifecyclePhase: 'playing' }),

  setScore: (scoreOrUpdater) =>
    set((state) => ({
      score: typeof scoreOrUpdater === 'function' ? scoreOrUpdater(state.score) : scoreOrUpdater,
    })),

  setPlayerHealth: (healthOrUpdater) =>
    set((state) => {
      // Disallow damage if already dead / game over
      if (state.playerHealth <= 0) {
        return state;
      }
      const nextHealth =
        typeof healthOrUpdater === 'function'
          ? healthOrUpdater(state.playerHealth)
          : healthOrUpdater;
      const clampedHealth = Math.max(0, Math.min(100, isNaN(nextHealth) ? 0 : nextHealth));

      if (clampedHealth === 0 && state.playerHealth > 0) {
        get().emitEvent({ type: 'game-over' });
        return { playerHealth: 0, isGameStarted: false };
      }

      return { playerHealth: clampedHealth };
    }),

  collectEntity: (entityId) => {
    const state = get();
    if (state.collectedEntityIds.includes(entityId)) {
      return false; // Reject duplicate collection
    }

    set({
      collectedEntityIds: [...state.collectedEntityIds, entityId],
      score: state.score + 10,
    });

    get().emitEvent({
      type: 'item-collected' as GameEventType,
      payload: { entityId, points: 10 },
    });

    return true;
  },

  restartGame: () => {
    set({
      playerHealth: 100,
      score: 0,
      collectedEntityIds: [],
      isGameStarted: true,
      isPaused: false,
      lifecyclePhase: 'ready',
    });

    get().emitEvent({
      type: 'game-started' as GameEventType,
      payload: { action: 'restart' },
    });
  },

  resetGame: () =>
    set({
      isGameStarted: false,
      isPaused: false,
      score: 0,
      playerHealth: 100,
      collectedEntityIds: [],
      lifecyclePhase: 'idle',
    }),

  // Non-destructive Bounded Event Log System
  emitEvent: (eventInput) => {
    const newEvent: GameEvent = {
      id: eventInput.id ?? `event_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: eventInput.type,
      timestamp: eventInput.timestamp ?? Date.now(),
      payload: eventInput.payload,
    };

    set((state) => ({
      activeEvents: [newEvent, ...state.activeEvents].slice(0, MAX_EVENT_LOG_SIZE),
    }));

    return newEvent;
  },

  clearEvents: () => set({ activeEvents: [] }),

  // Session Management
  resetWorld: () =>
    set({
      world: null,
      worldRevision: 0,
      generationStatus: 'idle',
      lifecyclePhase: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
      serverGenerationTimeMs: null,
      collectedEntityIds: [],
      isSceneReady: false,
      isPhysicsReady: false,
      telemetryLogs: [],
    }),

  resetSession: () =>
    set({
      transcript: '',
      isListening: false,
      speechError: null,
      world: null,
      worldRevision: 0,
      generationStatus: 'idle',
      lifecyclePhase: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
      serverGenerationTimeMs: null,
      collectedEntityIds: [],
      isSceneReady: false,
      isPhysicsReady: false,
      isGameStarted: false,
      isPaused: false,
      score: 0,
      playerHealth: 100,
      activeEvents: [],
      telemetryLogs: [],
    }),
}));
