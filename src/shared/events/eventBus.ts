import type { GameEvent, GameEventType } from '../schemas/worldSchema';
import { useDreamStore } from '../../store/useDreamStore';

export type EventListener = (event: GameEvent) => void;

class GameEventBus {
  private listeners: Map<GameEventType | '*', Set<EventListener>> = new Map();

  /**
   * Subscribes an event listener for a specific event type or all events ('*').
   * Returns an unsubscribe cleanup function.
   */
  public subscribe(type: GameEventType | '*', listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Publishes an event to all independent subscribers and records it in the Zustand event log.
   */
  public publish(
    eventInput: Omit<GameEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ): GameEvent {
    // 1. Commit to Zustand bounded event log
    const event = useDreamStore.getState().emitEvent(eventInput);

    // 2. Dispatch to specific type subscribers
    const typeSubscribers = this.listeners.get(event.type);
    if (typeSubscribers) {
      typeSubscribers.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event.type}:`, err);
        }
      });
    }

    // 3. Dispatch to wildcard '*' subscribers
    const wildcardSubscribers = this.listeners.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard subscriber:`, err);
        }
      });
    }

    return event;
  }

  /**
   * Clears all registered subscribers (useful during test resets or unmounts).
   */
  public clearAllListeners(): void {
    this.listeners.clear();
  }
}

export const eventBus = new GameEventBus();
