import { z } from 'zod';

/**
 * Hex Color validator (e.g., #fff or #1a2b3c)
 */
export const HexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color must be a valid 3-character or 6-character hex string starting with #',
  });

/**
 * Coordinate and Vector3 schemas with bounds checking
 */
export const Coordinate3DSchema = z.object({
  x: z.number().finite().min(-50, 'X coordinate must be >= -50').max(50, 'X coordinate must be <= 50'),
  y: z.number().finite().min(-10, 'Y coordinate must be >= -10').max(100, 'Y coordinate must be <= 100'),
  z: z.number().finite().min(-50, 'Z coordinate must be >= -50').max(50, 'Z coordinate must be <= 50'),
}).strict();

export const Rotation3DSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
}).strict().default({ x: 0, y: 0, z: 0 });

export const Scale3DSchema = z.object({
  x: z.number().finite().min(0.05, 'Scale X must be >= 0.05').max(20, 'Scale X must be <= 20'),
  y: z.number().finite().min(0.05, 'Scale Y must be >= 0.05').max(20, 'Scale Y must be <= 20'),
  z: z.number().finite().min(0.05, 'Scale Z must be >= 0.05').max(20, 'Scale Z must be <= 20'),
}).strict().default({ x: 1, y: 1, z: 1 });

/**
 * Biome enumeration
 */
export const BiomeEnum = z.enum([
  'enchanted_forest',
  'floating_islands',
  'desert_ruins',
  'crystal_cave',
  'dark_castle',
  'cosmic_void',
]);
export type BiomeType = z.infer<typeof BiomeEnum>;

/**
 * Overall Game Mood enumeration
 */
export const GameMoodEnum = z.enum(['dream', 'doom', 'surreal', 'mystery']);
export type GameMood = z.infer<typeof GameMoodEnum>;

/**
 * Audio Mood enumeration
 */
export const AudioMoodEnum = z.enum(['calm', 'mystical', 'tense', 'chaotic']);
export type AudioMood = z.infer<typeof AudioMoodEnum>;

/**
 * Asset Identifiers allowlist
 */
export const AssetTypeEnum = z.enum([
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
]);
export type AssetType = z.infer<typeof AssetTypeEnum>;

/**
 * Physics Body Type enumeration
 */
export const PhysicsTypeEnum = z.enum(['fixed', 'dynamic', 'sensor']);
export type PhysicsType = z.infer<typeof PhysicsTypeEnum>;

/**
 * Interaction Type enumeration
 */
export const InteractionTypeEnum = z.enum(['none', 'collectible', 'hazard', 'portal']);
export type InteractionType = z.infer<typeof InteractionTypeEnum>;

/**
 * Weather Schema
 */
export const WorldWeatherSchema = z.object({
  type: z.enum(['clear', 'rain', 'snow', 'fog']),
  intensity: z.number().finite().min(0, 'Intensity must be >= 0').max(1, 'Intensity must be <= 1'),
}).strict();
export type WorldWeather = z.infer<typeof WorldWeatherSchema>;

/**
 * Environment Schema
 */
export const WorldEnvironmentSchema = z.object({
  skyColor: HexColorSchema,
  fogColor: HexColorSchema,
  groundColor: HexColorSchema,
  fogDensity: z.number().finite().min(0, 'Fog density must be >= 0').max(0.2, 'Fog density must be <= 0.2'),
}).strict();
export type WorldEnvironment = z.infer<typeof WorldEnvironmentSchema>;

/**
 * Lighting Schema
 */
export const WorldLightingSchema = z.object({
  ambientIntensity: z.number().finite().min(0, 'Ambient intensity must be >= 0').max(5, 'Ambient intensity must be <= 5'),
  directionalIntensity: z.number().finite().min(0, 'Directional intensity must be >= 0').max(10, 'Directional intensity must be <= 10'),
  directionalColor: HexColorSchema,
}).strict();
export type WorldLighting = z.infer<typeof WorldLightingSchema>;

/**
 * World Entity Schema
 */
export const WorldEntitySchema = z.object({
  id: z.string().min(1, 'Entity id must not be empty'),
  asset: AssetTypeEnum,
  position: Coordinate3DSchema,
  rotation: Rotation3DSchema.default({ x: 0, y: 0, z: 0 }),
  scale: Scale3DSchema.default({ x: 1, y: 1, z: 1 }),
  color: HexColorSchema.optional(),
  physics: PhysicsTypeEnum.default('fixed'),
  interaction: InteractionTypeEnum.default('none'),
}).strict();
export type WorldEntity = z.infer<typeof WorldEntitySchema>;

/**
 * WorldSpec Schema (Master Scene Graph)
 */
export const WorldSpecSchema = z.object({
  id: z.string().min(1, 'World id must not be empty'),
  title: z.string().min(1, 'World title must not be empty'),
  description: z.string().min(1, 'World description must not be empty'),
  biome: BiomeEnum,
  mood: GameMoodEnum,
  audioMood: AudioMoodEnum,
  environment: WorldEnvironmentSchema,
  lighting: WorldLightingSchema,
  weather: WorldWeatherSchema,
  spawnPoint: Coordinate3DSchema,
  entities: z.array(WorldEntitySchema)
    .max(28, 'World cannot exceed 28 entities for 60fps performance')
    .superRefine((entities, ctx) => {
      const seenIds = new Set<string>();
      entities.forEach((entity, index) => {
        if (seenIds.has(entity.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate entity id detected: "${entity.id}" at index ${index}`,
            path: [index, 'id'],
          });
        }
        seenIds.add(entity.id);
      });
    }),
}).strict();
export type WorldSpec = z.infer<typeof WorldSpecSchema>;

/**
 * Game Event Definitions
 */
export const GameEventTypeEnum = z.enum([
  'world-generated',
  'player-jump',
  'item-collected',
  'player-damaged',
  'portal-entered',
  'game-over',
]);
export type GameEventType = z.infer<typeof GameEventTypeEnum>;

export const GameEventSchema = z.object({
  id: z.string(),
  type: GameEventTypeEnum,
  timestamp: z.number().finite(),
  payload: z.record(z.unknown()).optional(),
}).strict();
export type GameEvent = z.infer<typeof GameEventSchema>;
