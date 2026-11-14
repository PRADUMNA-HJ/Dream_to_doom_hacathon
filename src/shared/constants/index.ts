import type { WorldSpec, AssetType } from '../schemas/worldSchema';

export * from './demoPresets';

export const MAX_WORLD_ENTITIES = 28;

export const ASSET_IDENTIFIERS: readonly AssetType[] = [
  'tree',
  'rock',
  'house',
  'portal',
  'crystal',
  'enemy',
  'platform',
  'mushroom',
  'lamp',
  'cloud',
] as const;

/**
 * Standard baseline mock world for local development testing & offline fallback.
 * Strictly conforms to WorldSpecSchema.
 */
export const DEFAULT_MOCK_WORLD: WorldSpec = {
  id: 'world-dev-baseline',
  title: 'Emerald Grove Sanctuary',
  description: 'A serene ancient glade with ancient platforms and luminescent crystals.',
  biome: 'enchanted_forest',
  mood: 'dream',
  audioMood: 'calm',
  environment: {
    skyColor: '#0a192f',
    fogColor: '#172a45',
    groundColor: '#1b3b2b',
    fogDensity: 0.02,
  },
  lighting: {
    ambientIntensity: 0.4,
    directionalIntensity: 1.0,
    directionalColor: '#fff5ea',
  },
  weather: {
    type: 'clear',
    intensity: 0.0,
  },
  spawnPoint: {
    x: 0,
    y: 1.5,
    z: 0,
  },
  entities: [
    {
      id: 'entity-tree-1',
      asset: 'tree',
      position: { x: -6, y: 0, z: -8 },
      rotation: { x: 0, y: 0.4, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
      color: '#2e7d32',
      physics: 'fixed',
      interaction: 'none',
    },
    {
      id: 'entity-crystal-1',
      asset: 'crystal',
      position: { x: 4, y: 0.5, z: -5 },
      rotation: { x: 0, y: 1.2, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#64ffda',
      physics: 'dynamic',
      interaction: 'collectible',
    },
    {
      id: 'entity-platform-1',
      asset: 'platform',
      position: { x: 0, y: 0, z: -10 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 4, y: 0.4, z: 4 },
      color: '#495670',
      physics: 'fixed',
      interaction: 'none',
    },
  ],
};
