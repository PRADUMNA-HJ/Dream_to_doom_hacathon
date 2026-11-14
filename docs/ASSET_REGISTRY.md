# Dream-to-Doom — Central Asset Registry Documentation

**Document Status:** Complete & Verified
**Project:** Dream-to-Doom — Voice-to-Playable-3D
**Component:** `src/world3d/AssetRegistry.tsx`
**Auditor:** Hackathon Technical Lead & 3D Gameplay Integration Lead

---

## 1. Architectural Purpose

In a live hackathon environment, streaming large external GLTF binary assets introduces high failure risks due to network latency, CORS blocks, and CDN outages. Dream-to-Doom solves this with a **centralized procedural asset engine**:
- All 10 canonical asset taxonomy identifiers defined in the shared Zod schema have fully rendered procedural visual hulls.
- Each asset features customized materials, lighting, animations, and Rapier 3D colliders.
- If external GLTF models are absent or loading fails, the application instantly renders procedural primitives with zero frame drops.

---

## 2. Central AssetRegistry Interface

The central registry in `src/world3d/AssetRegistry.tsx` exposes the following strongly-typed API:

```typescript
export interface AssetDefinition {
  type: AssetType;
  name: string;
  collider: 'ball' | 'cuboid' | 'hull';
  defaultPhysics: PhysicsType;
  defaultInteraction: InteractionType;
  defaultScale: { x: number; y: number; z: number };
  description: string;
}

export const AssetRegistry = {
  getAssetRenderer: (assetType: AssetType) => React.FC<{ color?: string }>;
  getAssetCollider: (assetType: AssetType) => 'ball' | 'cuboid' | 'hull';
  getDefaultPhysics: (assetType: AssetType) => PhysicsType;
  getDefaultInteraction: (assetType: AssetType) => InteractionType;
  getDefaultScale: (assetType: AssetType) => { x: number; y: number; z: number };
  getDefinition: (assetType: AssetType) => AssetDefinition | undefined;
  getAllTypes: () => AssetType[];
};
```

---

## 3. All 10 Canonical Assets Matrix

| Taxonomy ID | Asset Name | Procedural Visual Geometry | Rapier Collider | Default Physics | Default Interaction | Default Scale [X, Y, Z] |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **`tree`** | Conifer Tree | Cylinder trunk + double-cone foliage tiers | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`rock`** | Granite Boulder | Polyhedral dodecahedron with roughness | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`house`** | Alpine Cottage | Box base structure + 45° pitched pyramidal roof | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`portal`** | Mystic Gateway | Emissive torus outer ring + inner vortex disc | `cuboid` | `sensor` | `portal` | `[1.0, 1.0, 1.0]` |
| **`crystal`** | Aether Crystal | Faceted floating octahedron with cyan emission | `ball` | `sensor` | `collectible` | `[1.0, 1.0, 1.0]` |
| **`enemy`** | Hazard Drone | Spiky icosahedron robot with crimson core | `ball` | `dynamic` | `hazard` | `[1.0, 1.0, 1.0]` |
| **`platform`** | Floating Deck | Wide flattened box ($3.0 \times 0.5 \times 3.0$) | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`mushroom`** | Giant Fungi | Cylindrical stipe + hemispherical cap | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`lamp`** | Street Lantern | Iron post + emissive bulb + dynamic `pointLight` | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |
| **`cloud`** | Cumulus Formation | Clustered translucent spheres with float animation | `cuboid` | `fixed` | `none` | `[1.0, 1.0, 1.0]` |

---

## 4. Rapier Collider Mapping & Optimization

1. **Sensor Colliders (`sensor={true}`):**
   - Applied to `crystal` and `portal` entities.
   - Triggers `onIntersectionEnter` callbacks without obstructing character locomotion.
2. **Dynamic & Kinematic Colliders:**
   - Applied to `enemy` hazard drones for realistic physics simulation.
   - Ball colliders (`colliders="ball"`) ensure high-performance physics ticks without triangle-mesh computational overhead.
3. **Fixed Solid Colliders:**
   - Applied to `tree`, `rock`, `house`, and `platform`.
   - Prevent player penetration, providing tangible gameplay collision surfaces.
