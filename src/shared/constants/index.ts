import type { WorldSpec, AssetType } from '../schemas/worldSchema';
import { ENCHANTED_FOREST_PRESET_WORLD } from './demoPresets';

export type { WorldSpec, AssetType };
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
export const DEFAULT_MOCK_WORLD: WorldSpec = ENCHANTED_FOREST_PRESET_WORLD;

