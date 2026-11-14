import { describe, it, expect } from 'vitest';
import { WorldSpecSchema } from './worldSchema';
import { DEFAULT_MOCK_WORLD } from '../constants';

describe('WorldSpecSchema (Zod Scene Graph Contract)', () => {
  it('accepts a valid WorldSpec', () => {
    const result = WorldSpecSchema.safeParse(DEFAULT_MOCK_WORLD);
    expect(result.success).toBe(true);
  });

  it('rejects when required fields are missing', () => {
    const invalid = { ...DEFAULT_MOCK_WORLD };
    // @ts-expect-error Testing runtime missing field
    delete invalid.title;

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex colors', () => {
    const invalid = {
      ...DEFAULT_MOCK_WORLD,
      environment: {
        ...DEFAULT_MOCK_WORLD.environment,
        skyColor: 'blue', // Not a hex starting with #
      },
    };

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects unknown asset identifiers not in allowlist', () => {
    const invalid: unknown = {
      ...DEFAULT_MOCK_WORLD,
      entities: [
        {
          id: 'alien_spaceship_1',
          asset: 'spaceship_unsupported',
          position: { x: 0, y: 0, z: 0 },
          physics: 'fixed',
          interaction: 'none',
        },
      ],
    };

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects coordinates out of bounds', () => {
    const invalid: unknown = {
      ...DEFAULT_MOCK_WORLD,
      entities: [
        {
          id: 'out_of_bounds_entity',
          asset: 'rock',
          position: { x: 9999, y: 0, z: 0 }, // Max is 50
          physics: 'fixed',
          interaction: 'none',
        },
      ],
    };

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when entities exceed maximum limit of 28', () => {
    const entities = Array.from({ length: 29 }, (_, i) => ({
      id: `entity_${i}`,
      asset: 'rock' as const,
      position: { x: 0, y: 0, z: 0 },
      physics: 'fixed' as const,
      interaction: 'none' as const,
    }));

    const invalid = {
      ...DEFAULT_MOCK_WORLD,
      entities,
    };

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate entity IDs', () => {
    const invalid = {
      ...DEFAULT_MOCK_WORLD,
      entities: [
        {
          id: 'duplicate_id',
          asset: 'rock' as const,
          position: { x: 0, y: 0, z: 0 },
          physics: 'fixed' as const,
          interaction: 'none' as const,
        },
        {
          id: 'duplicate_id', // Duplicate!
          asset: 'tree' as const,
          position: { x: 2, y: 0, z: 2 },
          physics: 'fixed' as const,
          interaction: 'none' as const,
        },
      ],
    };

    const result = WorldSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Duplicate entity id detected');
    }
  });
});
