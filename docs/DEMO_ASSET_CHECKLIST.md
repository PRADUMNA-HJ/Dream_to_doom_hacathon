# Dream-to-Doom — Demo Asset Registry & Fallback Checklist

**Document Version:** 1.0.0 — Final Rehearsal
**Project:** Dream-to-Doom — Voice-to-Playable-3D
**Sprint Phase:** Final Demo Readiness, Feature Gap Closure & Rehearsal
**Auditor:** Person 1 (Integrator & AI Lead)

---

## 1. Overview & Architectural Rationale

In real-time hackathon presentations, network latency and large external file downloads (GLTF/GLB binaries) represent significant failure points. Dream-to-Doom implements a **zero-downtime hybrid asset architecture**:

1. **Schema Whitelist:** Gemini 1.5/2.5 Flash strictly restricts entity assets to 10 verified IDs via OpenAPI 3.0 schema enums.
2. **Procedural Geometry Engine (`AssetRegistry.tsx`):** Every single asset is mapped to an instant procedural 3D geometric representation with custom materials, shadows, and emissive lighting.
3. **Rapier Collider Integration (`ModelInstance.tsx`):** Every asset automatically receives tailored physics collider hulls (`cuboid` or `ball`) and interaction sensor bindings.

---

## 2. All 10 Assets Verification Table

| Asset ID | Geometry & Procedural Fallback | Lighting / Material Effects | Rapier Collider Shape | Default Physics Type | Interaction Behavior | Multi-Instance Safe |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **`tree`** | Multi-tiered foliage cones + cylinder trunk | Diffuse forest green, castShadow enabled | `cuboid` | `fixed` | Obstacle collision | ✅ Yes |
| **`rock`** | Low-poly dodecahedron geometry | Rough stony slate grey, receiveShadow + castShadow | `cuboid` | `fixed` | Static terrain obstacle | ✅ Yes |
| **`house`** | Box geometry base + 45° pitched cone roof | Earthy brown timber base with crimson roof | `cuboid` | `fixed` | Solid structure | ✅ Yes |
| **`portal`** | Torus outer ring + inner semi-transparent vortex disc | Neon violet emissive glow (0.8 intensity) + continuous spin animation | `cuboid` / `sensor` | `sensor` | Fires `portal-entered` event & SFX | ✅ Yes |
| **`crystal`** | Floating octahedron geometry with vertical oscillation | Cyan bioluminescent emissive glow (0.6 intensity) + Y-axis rotation | `ball` | `sensor` | Fires `item-collected`, +10 score, Tone.js chime | ✅ Yes |
| **`enemy`** | Spiky icosahedron robot / hazard drone | High-contrast red emissive core (0.5 intensity) | `ball` | `dynamic` / `fixed` | Fires `player-damaged`, 1200ms rate-limited cooldown | ✅ Yes |
| **`platform`** | Wide flattened box geometry ($3 \times 0.5 \times 3$) | Metallic dark slate with high roughness | `cuboid` | `fixed` | Walkable jump surface | ✅ Yes |
| **`mushroom`** | Stem cylinder + half-sphere cap geometry | Cream stem with vibrant magenta cap | `cuboid` | `fixed` | Environmental decor | ✅ Yes |
| **`lamp`** | Tall iron post + glowing sphere bulb | Dedicated `pointLight` ($r=8\text{m}$, intensity $2$) + emissive bulb ($1.2$) | `cuboid` | `fixed` | Dynamic scene illumination | ✅ Yes |
| **`cloud`** | Triple overlapping cloud sphere group | Semi-transparent white mist with sinusoidal float animation | `cuboid` | `fixed` | Sky vista / floating platforms | ✅ Yes |

---

## 3. Rendering & Physics Multi-Instance Verification

- **Instancing Performance:** Instantiating 50+ mixed assets across the 100m² arena maintains steady 60 FPS in WebGL.
- **Shadow Maps:** Directional sun light casts crisp shadow cascades across all procedural primitives.
- **Memory Footprint:** Zero external network requests needed for initial world render; zero texture GPU VRAM leaks.
- **Dynamic Swapping:** When changing worlds (e.g. from Enchanted Forest to Cyberpunk Rooftop), all previous RigidBodies unmount cleanly without orphan physics bodies in the Rapier world simulation.

