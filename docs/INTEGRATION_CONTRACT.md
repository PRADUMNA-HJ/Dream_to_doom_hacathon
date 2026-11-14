# Dream-to-Doom — Integration Contract (Phase 1)

This document serves as the single source of truth for communication contracts between the AI output, the Zustand global state store, and the feature domains owned by Person 2 (3D Graphics) and Person 3 (Sensory/Audio).

---

## 1. System Overview & Data Flow

```
User Voice Input
       │
       ▼
Web Speech API (Person 3)
       │ (transcript: string)
       ▼
Zustand Store / Controller (Person 1)
       │ (POST /api/generate-world)
       ▼
Gemini Serverless Function (Phase 2)
       │ (Structured JSON)
       ▼
Zod Runtime Validation (`WorldSpecSchema`)
       │ (Validated WorldSpec)
       ▼
Zustand Global Store (`world`)
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
Person 2: 3D Graphics Engine              Person 3: Sensory & Audio Engine
- Reads `world.entities`                  - Reads `world.audioMood`
- Reads `world.environment` & `lighting`  - Reads `world.weather`
- Instantiates GLTF models                - Modulates Tone.js synths & moods
- Configures Rapier physics               - Listens to `activeEvents` stream
```

---

## 2. Coordinate Conventions

To guarantee alignment between 3D physics, camera placement, spawn points, and instanced objects, the entire application adheres strictly to standard Three.js right-handed Cartesian coordinates:

* **X-Axis:** Horizontal axis. Negative is Left ($-X$), Positive is Right ($+X$).
* **Y-Axis:** Vertical elevation axis. Negative is Down ($-Y$), Positive is Up ($+Y$). Ground plane standard is $Y = 0$.
* **Z-Axis:** Forward / Backward depth axis. Negative is Forward / Into the screen ($-Z$), Positive is Backward / Toward the camera ($+Z$).

All position, rotation (Euler in radians), and scale objects use `{ x: number, y: number, z: number }`.

---

## 3. WorldSpec JSON Structure

```json
{
  "id": "world_1731600000000",
  "title": "Neon Monolith Wasteland",
  "description": "A surreal cybernetic plain dotted with glowing pillars and floating platforms.",
  "biome": "floating_islands",
  "mood": "surreal",
  "audioMood": "mystical",
  "environment": {
    "skyColor": "#0a0a1a",
    "fogColor": "#150d2a",
    "groundColor": "#101018",
    "fogDensity": 0.03
  },
  "lighting": {
    "ambientIntensity": 0.4,
    "directionalIntensity": 1.2,
    "directionalColor": "#ff007f"
  },
  "weather": {
    "type": "fog",
    "intensity": 0.6
  },
  "spawnPoint": {
    "x": 0,
    "y": 1.5,
    "z": 0
  },
  "entities": [
    {
      "id": "entity-1",
      "asset": "crystal",
      "position": { "x": 4.5, "y": 1.0, "z": -6.0 },
      "rotation": { "x": 0, "y": 0.785, "z": 0 },
      "scale": { "x": 1.2, "y": 1.2, "z": 1.2 },
      "color": "#00ffff",
      "physics": "dynamic",
      "interaction": "collectible"
    },
    {
      "id": "entity-2",
      "asset": "platform",
      "position": { "x": 0, "y": 0, "z": -10.0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 3.0, "y": 0.5, "z": 3.0 },
      "color": "#333344",
      "physics": "fixed",
      "interaction": "none"
    }
  ]
}
```

---

## 4. Enum Definitions & Allowlist

### Biomes (`biome`)
* `enchanted_forest` — Lush, bioluminescent flora and organic formations.
* `floating_islands` — Fragmented landmasses suspended in mid-air.
* `desert_ruins` — Arid sands with ancient monumental structures.
* `crystal_cave` — Subterranean cavern illuminated by refractive crystals.
* `dark_castle` — Gothic architecture with ominous towers and stone masonry.
* `cosmic_void` — Starfield backdrop with abstract crystalline structures.

### Game Mood (`mood`)
* `dream` — Serene, uplifting, vibrant.
* `doom` — Oppressive, apocalyptic, dark.
* `surreal` — Dreamlike, irrational, hyper-stylized.
* `mystery` — Foggy, enigmatic, muted tones.

### Audio Mood (`audioMood`)
* `calm` — Slow attack ambient pads, major pentatonic chords.
* `mystical` — Shimmering reverb, suspended chords, microtonal texture.
* `tense` — Minor scales, pulsing rhythmic bass drones.
* `chaotic` — Dissonant intervals, rapid tempo fluctuations, bitcrushed textures.

### Weather (`weather.type`)
* `clear` — No particle effects, full visibility.
* `rain` — Downward particle streak simulation, damp ground reflectivity.
* `snow` — Slow drifting flakes, fog dampening.
* `fog` — Heavy volumetric fog accumulation.

### Supported 3D Asset Identifiers (`asset`)
The 3D team maps these exact string keys to preloaded GLTF assets located in `/public/models/{asset}.glb`:
1. `tree`
2. `rock`
3. `house`
4. `portal`
5. `crystal`
6. `enemy`
7. `platform`
8. `mushroom`
9. `lamp`
10. `cloud`

*Note: The asset allowlist is strictly enforced by Zod. Any unknown asset keys returned by the AI are rejected.*

### Physics Types (`physics`)
* `fixed` — Immovable rigid body with static colliders (ground, platforms, large houses).
* `dynamic` — Physics-enabled body affected by gravity and impulses (movable boulders, dropped orbs).
* `sensor` — Pass-through collision volume that triggers events without physical bounce (portals, collectible fields).

### Interaction Types (`interaction`)
* `none` — Decorative or architectural element; standard solid collision.
* `collectible` — Disappears upon player contact, plays pickup SFX, awards score.
* `hazard` — Damages player health on touch and triggers hazard audio cue.
* `portal` — Teleports player or triggers world transition event.

---

## 5. Validation Rules (Zod Enforcement)

To protect the 3D renderer and physics engine from crashing or dropping below 60 FPS:
1. **Coordinate Clamping:**
   * $X \in [-50, 50]$
   * $Y \in [-10, 100]$
   * $Z \in [-50, 50]$
2. **Scale Clamping:**
   * $Scale \in [0.05, 20.0]$
3. **Finite Numbers:** All floats must be finite (`z.number().finite()`). `NaN` and `Infinity` are rejected.
4. **Hex Colors:** Must match regex `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`.
5. **Entity Cap:** Maximum **28** entities per world. Higher counts are rejected to avoid draw-call saturation.
6. **Unique Entity IDs:** All entity IDs within a single world must be strictly unique.
7. **Weather Intensity:** Normalized float between $0.0$ and $1.0$.
8. **Lighting Intensities:** Non-negative floats with sane upper bounds ($0 \le ambient \le 5.0$, $0 \le directional \le 10.0$).

---

## 6. Domain Consumption Guide

### For Person 2 (3D Lead)
1. **Subscription:**
   ```typescript
   import { useDreamStore } from '../store/useDreamStore';

   const world = useDreamStore((state) => state.world);
   ```
2. **Mounting:** When `world` updates, map `world.environment` to `<Sky />` and `<fog />`. Iterate `world.entities` to render `<RigidBody type={entity.physics}>` with `<ModelInstance asset={entity.asset} />`.
3. **Spawn:** Place player character at `world.spawnPoint`.
4. **Physics Warnings:** Never update Zustand on every `useFrame`. High-frequency character transforms belong in Rapier physics refs.

### For Person 3 (Sensory & Audio Lead)
1. **Voice Input:** Dispatch recognized transcripts using:
   ```typescript
   const { setTranscript, setListening, setSpeechError } = useDreamStore.getState();
   ```
2. **Audio Modulation:** Subscribe to `world.audioMood` and `world.weather`:
   ```typescript
   const audioMood = useDreamStore((state) => state.world?.audioMood);
   ```
3. **Event Audio:** Subscribe to `activeEvents` stream to trigger one-shot sound effects (`item-collected`, `player-damaged`, `portal-entered`).
