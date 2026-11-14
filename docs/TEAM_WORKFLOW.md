# Dream-to-Doom — Team Workflow & Integration Contract

**Sprint Window:** 24-Hour Hackathon  
**Architecture Model:** Domain-Driven Serverless Client  
**Version:** Phase 1 Foundation

---

## 1. Domain Ownership Boundaries

To eliminate Git merge conflicts and unblock simultaneous parallel velocity, the repository is partitioned strictly by domain ownership:

| Developer | Domain Role | Directory Ownership | Prohibited Modifying |
| :--- | :--- | :--- | :--- |
| **Person 1** | **Integrator & AI Lead** *(Repo Owner)* | `src/shared/`<br/>`src/store/`<br/>`src/services/`<br/>`src/components/`<br/>`api/`<br/>Root config (`vite.config.ts`, `package.json`, etc.) | `src/world3d/` internals<br/>`src/sensory/` internals |
| **Person 2** | **3D Graphics Lead** | `src/world3d/`<br/>`public/models/` | `src/shared/`<br/>`src/store/`<br/>`src/services/`<br/>`api/`<br/>`src/sensory/` |
| **Person 3** | **Sensory & Input Lead** | `src/sensory/`<br/>`public/sfx/` | `src/shared/`<br/>`src/store/`<br/>`src/services/`<br/>`api/`<br/>`src/world3d/` |

---

## 2. Shared Integration Rules

1. **Person 1 Maintains the Shared Contracts:** All global types (`src/shared/`), the central store (`src/store/`), and the AI API interface (`src/services/`) are maintained exclusively by Person 1.
2. **Zero Interface Duplication:** Person 2 and Person 3 must never declare duplicate TypeScript interfaces for `WorldSpec`, `WorldEntity`, or `GameEvent`. Always import directly from `../shared/schemas/worldSchema` or `../shared/types`.
3. **No Direct State Mutations:** Never write arbitrary global variables or window properties. All shared cross-domain data passes through `useDreamStore`.
4. **No Destructive Event Popping:** The `activeEvents` array in Zustand is a non-destructive event log. Never `splice` or `shift` elements from it. Consumers keep track of the `id` of the last event they processed.
5. **No Render-Loop Store Mutations:** Never call Zustand actions inside Three.js `useFrame` rendering loops. High-frequency physics and camera transforms must remain inside local Rapier rigid body references.
6. **Feature Branching Protocol:** Never push directly to `main`. Every team member develops on their assigned branch:
   - Person 1: `feature/person1-foundation` (and later `feature/ai-integration`)
   - Person 2: `feature/3d-world`
   - Person 3: `feature/sensory-input`

---

## 3. Quick Reference: Imports for Teammates

### For Person 2 (3D Graphics Lead)
In `src/world3d/SceneContainer.tsx`:
```typescript
import { useDreamStore } from '../store/useDreamStore';
import type { WorldSpec, WorldEntity } from '../shared/schemas/worldSchema';

export function SceneContainer() {
  // Selective subscription: only re-renders when world changes
  const world = useDreamStore((state) => state.world);
  const generationStatus = useDreamStore((state) => state.generationStatus);

  if (!world) {
    return <FallbackEnvironment status={generationStatus} />;
  }

  return (
    <Canvas>
      <Sky sunPosition={world.lighting.directionalIntensity > 0 ? [10, 20, 10] : [0, -10, 0]} />
      <ambientLight intensity={world.lighting.ambientIntensity} />
      <directionalLight 
        intensity={world.lighting.directionalIntensity} 
        color={world.lighting.directionalColor} 
      />
      <Physics>
        {world.entities.map((entity: WorldEntity) => (
          <ModelInstance key={entity.id} entity={entity} />
        ))}
      </Physics>
    </Canvas>
  );
}
```

### For Person 3 (Sensory & Audio Lead)
In `src/sensory/SpeechController.ts` & `src/sensory/SoundEngine.ts`:
```typescript
import { useDreamStore } from '../store/useDreamStore';
import type { AudioMood, GameEvent } from '../shared/schemas/worldSchema';

// 1. Dispatching voice transcript to store
export function onSpeechResult(transcript: string) {
  useDreamStore.getState().setTranscript(transcript);
}

// 2. Subscribing to AI-determined audio mood in Tone.js engine
export function initAudioEngine() {
  useDreamStore.subscribe(
    (state) => state.world?.audioMood,
    (audioMood) => {
      if (audioMood) {
        updateSynthHarmonics(audioMood);
      }
    }
  );

  // 3. Subscribing to game events (non-destructive)
  let lastProcessedEventId: string | null = null;
  useDreamStore.subscribe(
    (state) => state.activeEvents,
    (events) => {
      if (events.length === 0) return;
      const latest = events[0];
      if (latest.id !== lastProcessedEventId) {
        lastProcessedEventId = latest.id;
        playEventSfx(latest.type);
      }
    }
  );
}
```
