# Dream-to-Doom — Multi-Consumer Game Event System

This document specifies the architecture of the non-destructive multi-consumer event bus in **Dream-to-Doom**, ensuring that physics events emitted by Person 2's 3D engine reach Person 3's audio synthesizer and Person 1's HUD without cross-consumer event loss.

---

## 1. The Multi-Consumer Problem

In conventional message queues where consumers `pop()` or `shift()` events, a race condition occurs:
1. Person 2 publishes `item-collected`.
2. Person 1's HUD pops the event to increment the score.
3. Person 3's Tone.js engine checks the queue—the event is gone! The audio pickup chime never plays.

---

## 2. Dream-to-Doom Solution: Dual-Layer Event Bus

Dream-to-Doom implements a dual-layer approach:
1. **Zustand Bounded Log:** Retains the last 50 events in `useDreamStore.getState().activeEvents` for historical telemetry, HUD inspection, and state synchronization.
2. **Synchronous Publish-Subscribe Dispatcher (`GameEventBus`):** Dispatches every event synchronously to all registered callbacks before returning.

```
       [Game Event Trigger: e.g. Rapier Collider]
                           │
                           ▼
           eventBus.publish({ type, payload })
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 [Zustand Event Log]              [Subscriber Registry]
 - activeEvents: GameEvent[]       - type: 'item-collected' ──> Tone.js SFX
 - Max 50 items (bounded)         - type: '*' ──> Pipeline Telemetry Logs
 - UI telemetry stream            - type: 'portal-entered' ──> Camera Warp
```

---

## 3. Supported Event Types

| Event Type | Producer | Consumers | Payload Description |
| :--- | :--- | :--- | :--- |
| `world-generated` | Serverless AI / Zustand | Tone.js, HUD, 3D Canvas | `{ worldId, title, biome, revision }` |
| `player-jump` | `PlayerController.tsx` | Tone.js (pitch sweep) | None |
| `item-collected` | `ModelInstance.tsx` | Tone.js (sparkle ping), Score (+10) | `{ entityId, asset }` |
| `player-damaged` | `ModelInstance.tsx` | Tone.js (noise burst), Health (-15) | `{ entityId, damage }` |
| `portal-entered` | `ModelInstance.tsx` | Tone.js (filter sweep), HUD | `{ entityId }` |
| `game-over` | Zustand Store | Tone.js (minor cadence), Error overlay | None |

---

## 4. Usage Guide for Developers

### Publishing an Event
```typescript
import { eventBus } from '../shared/events/eventBus';

// Inside a Rapier collision or interaction listener:
eventBus.publish({
  type: 'item-collected',
  payload: { entityId: 'crystal_01', asset: 'crystal' },
});
```

### Subscribing to an Event
```typescript
import { eventBus } from '../shared/events/eventBus';

// Inside a React useEffect or initialization script:
useEffect(() => {
  const unsubscribe = eventBus.subscribe('item-collected', (event) => {
    soundEngine.playEventSfx(event.type);
  });

  return () => {
    unsubscribe(); // Clean up on unmount
  };
}, []);
```
