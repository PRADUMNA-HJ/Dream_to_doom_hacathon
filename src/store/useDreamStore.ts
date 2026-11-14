import { create } from 'zustand';
import type { WorldSpec, GameEvent, GameEventType } from '../shared/schemas/worldSchema';

export type GenerationStatus = 'idle' | 'generating' | 'validating' | 'success' | 'error';

export interface VoiceInputState {
  transcript: string;
  isListening: boolean;
  speechError: string | null;
}

export interface WorldGenerationState {
  world: WorldSpec | null;
  generationStatus: GenerationStatus;
  generationError: string | null;
  requestId: string | null;
  generationStartedAt: number | null;
  generationCompletedAt: number | null;
}

export interface GameplayState {
  isGameStarted: boolean;
  isPaused: boolean;
  score: number;
  playerHealth: number;
}

export interface DreamStoreState extends VoiceInputState, WorldGenerationState, GameplayState {
  // Bounded event log (non-destructive for multiple consumers)
  activeEvents: GameEvent[];

  // Voice Input Actions (Person 3)
  setTranscript: (transcript: string) => void;
  setListening: (isListening: boolean) => void;
  setSpeechError: (error: string | null) => void;
  clearTranscript: () => void;

  // World Generation Actions (Person 1 / Controller)
  beginGeneration: (requestId: string) => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setWorld: (world: WorldSpec, responseRequestId: string) => boolean;
  failGeneration: (error: string, responseRequestId: string) => boolean;
  resetGeneration: () => void;

  // Gameplay Actions (Person 2 / Integrator)
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setPlayerHealth: (health: number | ((prev: number) => number)) => void;
  resetGame: () => void;

  // Event System (Broadcast to Person 2 and Person 3)
  emitEvent: (
    event: Omit<GameEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ) => GameEvent;
  clearEvents: () => void;

  // Session Management
  resetWorld: () => void;
  resetSession: () => void;
}

const MAX_EVENT_LOG_SIZE = 50;

export const useDreamStore = create<DreamStoreState>((set, get) => ({
  // Voice Input State
  transcript: '',
  isListening: false,
  speechError: null,

  // World Generation State
  world: null,
  generationStatus: 'idle',
  generationError: null,
  requestId: null,
  generationStartedAt: null,
  generationCompletedAt: null,

  // Gameplay State
  isGameStarted: false,
  isPaused: false,
  score: 0,
  playerHealth: 100,

  // Event Log
  activeEvents: [],

  // Voice Input Actions
  setTranscript: (transcript) => set({ transcript, speechError: null }),
  setListening: (isListening) => set({ isListening }),
  setSpeechError: (speechError) => set({ speechError, isListening: false }),
  clearTranscript: () => set({ transcript: '' }),

  // World Generation Actions with Concurrency Protection
  beginGeneration: (requestId) =>
    set({
      requestId,
      generationStatus: 'generating',
      generationError: null,
      generationStartedAt: Date.now(),
      generationCompletedAt: null,
    }),

  setGenerationStatus: (generationStatus) => set({ generationStatus }),

  setWorld: (world, responseRequestId) => {
    const currentRequestId = get().requestId;
    // Strict concurrency guard: ignore stale/outdated async responses
    if (responseRequestId !== currentRequestId) {
      return false;
    }

    set({
      world,
      generationStatus: 'success',
      generationError: null,
      generationCompletedAt: Date.now(),
    });

    // Automatically emit event for Person 2 and Person 3
    get().emitEvent({
      type: 'world-generated' as GameEventType,
      payload: { worldId: world.id, title: world.title, biome: world.biome },
    });

    return true;
  },

  failGeneration: (error, responseRequestId) => {
    const currentRequestId = get().requestId;
    if (responseRequestId !== currentRequestId) {
      return false;
    }

    set({
      generationStatus: 'error',
      generationError: error,
      generationCompletedAt: Date.now(),
    });

    return true;
  },

  resetGeneration: () =>
    set({
      generationStatus: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
    }),

  // Gameplay Actions
  startGame: () => set({ isGameStarted: true, isPaused: false, playerHealth: 100, score: 0 }),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  setScore: (scoreOrUpdater) =>
    set((state) => ({
      score: typeof scoreOrUpdater === 'function' ? scoreOrUpdater(state.score) : scoreOrUpdater,
    })),

  setPlayerHealth: (healthOrUpdater) =>
    set((state) => {
      const nextHealth =
        typeof healthOrUpdater === 'function'
          ? healthOrUpdater(state.playerHealth)
          : healthOrUpdater;
      const clampedHealth = Math.max(0, Math.min(100, nextHealth));

      if (clampedHealth === 0 && state.playerHealth > 0) {
        // Emit game-over event
        get().emitEvent({ type: 'game-over' });
      }

      return { playerHealth: clampedHealth };
    }),

  resetGame: () =>
    set({
      isGameStarted: false,
      isPaused: false,
      score: 0,
      playerHealth: 100,
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
      generationStatus: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
    }),

  resetSession: () =>
    set({
      transcript: '',
      isListening: false,
      speechError: null,
      world: null,
      generationStatus: 'idle',
      generationError: null,
      requestId: null,
      generationStartedAt: null,
      generationCompletedAt: null,
      isGameStarted: false,
      isPaused: false,
      score: 0,
      playerHealth: 100,
      activeEvents: [],
    }),
}));
