# Person 2 — 3D & Graphics Domain (`src/world3d/`)

This directory is exclusively owned by **Person 2 (3D/Graphics Lead)**.

## Responsibilities
* React Three Fiber (R3F) `<Canvas>` rendering pipeline.
* Dynamic entity instancing based on `world.entities` from the Zustand store (`useDreamStore`).
* Environment lighting, Sky gradients, Fog density, and camera rigs.
* Rapier physics (`@react-three/rapier`) RigidBody configurations (fixed, dynamic, sensor).
* Character movement controller and collision detection.

## Contract & Imports
* Import the shared types and store:
  ```typescript
  import { useDreamStore } from '../store/useDreamStore';
  import type { WorldSpec, WorldEntity } from '../shared/schemas/worldSchema';
  ```
* Subscribe selectively:
  ```typescript
  const world = useDreamStore((state) => state.world);
  const generationStatus = useDreamStore((state) => state.generationStatus);
  ```
* Do **NOT** modify files in `src/shared/`, `src/store/`, or `src/services/` directly. Coordinate schema changes through Person 1.
