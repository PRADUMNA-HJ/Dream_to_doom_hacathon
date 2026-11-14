/// <reference path="../types/react-ambient.d.ts" />
/// <reference path="../types/tone-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Game Event-to-Sound Mapping Hook
 * Connects the shared Zustand `activeEvents` stream to the procedural sound engine.
 *
 * ARCHITECTURAL CONTRACT:
 * - Subscribes to the shared `activeEvents: string[]` stream from Zustand.
 * - Maps event names to canonical `GameAudioEventType` sounds.
 * - Prevents duplicate sound triggers across React re-renders and React StrictMode.
 * - Non-destructive consumption: Does NOT clear shared events unless explicitly configured.
 * - Independent of 3D Canvas and ambient audio synthesis.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { GameAudioEventType } from '../types/audio.types';
import { playSoundEffect } from '../audio/soundEffects';
import { isAudioInitialized } from '../audio/audioManager';

// ============================================================================
// Canonical Event Aliases & Normalization Map
// ============================================================================

export const CANONICAL_GAME_AUDIO_EVENTS: readonly GameAudioEventType[] = [
  'world_generation_started',
  'object_spawned',
  'tree_generated',
  'building_generated',
  'enemy_spawned',
  'object_destroyed',
  'environment_changed',
  'world_generation_completed',
] as const;

/** Canonical mapping including team shorthand aliases from the architecture document */
const EVENT_NAME_MAP: Record<string, GameAudioEventType> = {
  // 1. World Generation Started / Completed
  world_generation_started: 'world_generation_started',
  'world:start': 'world_generation_started',
  generation_started: 'world_generation_started',
  'world-generated': 'world_generation_completed',
  world_generation_completed: 'world_generation_completed',
  'world:ready': 'world_generation_completed',
  generation_completed: 'world_generation_completed',
  world_ready: 'world_generation_completed',

  // 2. Object Spawned / Collected / Jump
  object_spawned: 'object_spawned',
  'spawn:object': 'object_spawned',
  spawn_object: 'object_spawned',
  'item-collected': 'object_spawned',
  'player-jump': 'object_spawned',

  // 3. Tree Generated
  tree_generated: 'tree_generated',
  'spawn:tree': 'tree_generated',
  spawn_tree: 'tree_generated',

  // 4. Building Generated
  building_generated: 'building_generated',
  'spawn:building': 'building_generated',
  spawn_building: 'building_generated',

  // 5. Enemy Spawned
  enemy_spawned: 'enemy_spawned',
  'spawn:enemy': 'enemy_spawned',
  spawn_enemy: 'enemy_spawned',

  // 6. Object Destroyed / Damaged / Game Over
  object_destroyed: 'object_destroyed',
  'destroy:object': 'object_destroyed',
  destroy_object: 'object_destroyed',
  'player-damaged': 'object_destroyed',
  'game-over': 'object_destroyed',

  // 7. Environment Changed / Portal Entered
  environment_changed: 'environment_changed',
  'env:change': 'environment_changed',
  weather_changed: 'environment_changed',
  'portal-entered': 'environment_changed',
};

// ============================================================================
// Helper: Normalize Raw Event Strings or GameEvent Objects
// ============================================================================

/**
 * Resolves a raw event string or typed event object (which may include UUIDs or prefixes like 'spawn:tree:entity_42')
 * into one of the 8 canonical GameAudioEventType values.
 */
export function resolveCanonicalAudioEvent(
  rawEvent: string | { type: string }
): GameAudioEventType | null {
  if (!rawEvent) return null;
  const eventString = typeof rawEvent === 'string' ? rawEvent : rawEvent.type;
  if (!eventString || typeof eventString !== 'string') return null;

  const trimmed = eventString.trim().toLowerCase();

  // 1. Direct match
  if (EVENT_NAME_MAP[trimmed]) {
    return EVENT_NAME_MAP[trimmed];
  }

  // 2. Strip trailing UUID or entity ID (e.g. 'object_spawned:id_123' -> 'object_spawned')
  const colonParts = trimmed.split(':');
  if (colonParts.length >= 2) {
    const twoPart = `${colonParts[0]}:${colonParts[1]}`;
    if (EVENT_NAME_MAP[twoPart]) return EVENT_NAME_MAP[twoPart];
    if (EVENT_NAME_MAP[colonParts[0]]) return EVENT_NAME_MAP[colonParts[0]];
  }

  // 3. Prefix matching against canonical events
  for (const canonical of CANONICAL_GAME_AUDIO_EVENTS) {
    if (trimmed.startsWith(canonical)) {
      return canonical;
    }
  }

  return null;
}

// ============================================================================
// Module-Scoped Global Deduplication Cache (Cross-Instance & Re-Mount Guard)
// ============================================================================

/**
 * Module-level timestamp registry tracking recent dispatches across all hook instances.
 * Guarantees that multiple simultaneous hook mounts or rapid remounts never produce duplicate sound.
 */
const globalRecentDispatches = new Map<string, number>();
const GLOBAL_DEDUP_WINDOW_MS = 60;

/** Prune expired entries from the global dispatch cache to prevent memory leaks */
function recordDispatch(key: string, timestamp: number): void {
  globalRecentDispatches.set(key, timestamp);

  // Periodic pruning when cache size grows
  if (globalRecentDispatches.size > 100) {
    for (const [k, time] of globalRecentDispatches.entries()) {
      if (timestamp - time > 10000) {
        globalRecentDispatches.delete(k);
      }
    }
  }
}

/**
 * Resets the module-level dispatch cache. Useful in unit tests or audio engine resets.
 */
export function resetGameAudioEventsCache(): void {
  globalRecentDispatches.clear();
}

// ============================================================================
// Hook Options Interface
// ============================================================================

export interface UseGameAudioEventsOptions {
  /** Whether game event audio playback is enabled (defaults to true) */
  enabled?: boolean;
  /** Custom mapping overrides for domain-specific events */
  customMapping?: Record<string, GameAudioEventType>;
  /** Callback fired whenever a game event triggers a sound effect */
  onEventSoundTriggered?: (event: GameAudioEventType, rawEvent: string) => void;
  /** Optional consumer clear action if Person 1 allows event consumption */
  clearEventsOnConsume?: () => void;
  /**
   * Whether to process historical events already present in activeEvents upon initial hook mount.
   * Defaults to false (only plays events arriving AFTER the hook mounts).
   * This guarantees genuine component unmounts and remounts do NOT replay stale history.
   */
  processHistoricalOnMount?: boolean;
}

// ============================================================================
// Main Hook: useGameAudioEvents
// ============================================================================

/**
 * Reusable React hook that listens to the shared Zustand `activeEvents` array,
 * processes new game events in order, and triggers procedural sound effects.
 *
 * Guarantees zero duplicate triggers during React StrictMode and genuine unmount/remount cycles.
 *
 * @param activeEvents - The array of active event strings from useDreamStore((s) => s.activeEvents)
 * @param options - Configuration options and callbacks
 */
export function useGameAudioEvents(
  activeEvents: readonly (string | { type: string })[] = [],
  options: UseGameAudioEventsOptions = {}
): {
  triggerAudioEvent: (event: GameAudioEventType | string) => boolean;
} {
  const {
    enabled = true,
    customMapping,
    onEventSoundTriggered,
    clearEventsOnConsume,
    processHistoricalOnMount = false,
  } = options;

  // Genuine Unmount/Remount Guard:
  // On initial mount of a new fiber, initialize cursor to current array length
  // so stale historical events sitting in the store are not replayed unless explicitly requested.
  const initialLength = (activeEvents || []).length;
  const lastProcessedIndexRef = useRef<number>(
    processHistoricalOnMount ? 0 : initialLength
  );
  const optionsRef = useRef<UseGameAudioEventsOptions>(options);

  // Synchronize options ref
  useEffect(() => {
    optionsRef.current = {
      enabled,
      customMapping,
      onEventSoundTriggered,
      clearEventsOnConsume,
      processHistoricalOnMount,
    };
  }, [
    enabled,
    customMapping,
    onEventSoundTriggered,
    clearEventsOnConsume,
    processHistoricalOnMount,
  ]);

  // Programmatic event trigger helper
  const triggerAudioEvent = useCallback(
    (event: GameAudioEventType | string): boolean => {
      if (!optionsRef.current.enabled) return false;
      if (!isAudioInitialized()) return false;

      const canonical =
        optionsRef.current.customMapping?.[event] ||
        resolveCanonicalAudioEvent(event);

      if (canonical) {
        const now = Date.now();
        const eventKey = `${canonical}:${event}`;
        const lastDispatched = globalRecentDispatches.get(eventKey) || 0;

        if (now - lastDispatched < GLOBAL_DEDUP_WINDOW_MS) {
          return false; // Throttled across instances
        }
        recordDispatch(eventKey, now);

        playSoundEffect(canonical);
        optionsRef.current.onEventSoundTriggered?.(canonical, event);
        return true;
      }
      return false;
    },
    []
  );

  // Subscribe and react to changes in activeEvents array
  useEffect(() => {
    if (!enabled) return;

    const eventsList = activeEvents || [];
    const currentLength = eventsList.length;

    // Handle array reset / clear by Person 1
    if (currentLength < lastProcessedIndexRef.current) {
      lastProcessedIndexRef.current = currentLength;
      return;
    }

    // Process only newly arrived events since last cursor
    if (currentLength > lastProcessedIndexRef.current) {
      const newEvents = eventsList.slice(lastProcessedIndexRef.current);
      lastProcessedIndexRef.current = currentLength;

      // Only proceed with audio playback if Web Audio engine has been initialized
      if (!isAudioInitialized()) {
        return;
      }

      // Process new events sequentially in arrival order
      newEvents.forEach((rawEvent) => {
        const eventStr = typeof rawEvent === 'string' ? rawEvent : rawEvent.type;
        const canonical =
          optionsRef.current.customMapping?.[eventStr] ||
          resolveCanonicalAudioEvent(rawEvent);

        if (canonical) {
          const now = Date.now();
          const eventKey = `${canonical}:${eventStr}`;
          const lastDispatched = globalRecentDispatches.get(eventKey) || 0;

          // Cross-instance and rapid remount duplicate prevention
          if (now - lastDispatched >= GLOBAL_DEDUP_WINDOW_MS) {
            recordDispatch(eventKey, now);
            playSoundEffect(canonical);
            optionsRef.current.onEventSoundTriggered?.(canonical, eventStr);
          }
        }
      });

      // Invoke consumer clear callback if explicitly provided by Person 1
      if (optionsRef.current.clearEventsOnConsume) {
        optionsRef.current.clearEventsOnConsume();
        lastProcessedIndexRef.current = 0;
      }
    }
  }, [activeEvents, enabled]);

  return { triggerAudioEvent };
}

export default useGameAudioEvents;

