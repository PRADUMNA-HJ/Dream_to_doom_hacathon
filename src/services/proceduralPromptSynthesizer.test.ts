import { describe, it, expect } from 'vitest';
import { synthesizeWorldFromPrompt } from './proceduralPromptSynthesizer';
import { WorldSpecSchema } from '../shared/schemas/worldSchema';

describe('proceduralPromptSynthesizer', () => {
  it('synthesizes a valid WorldSpec compliant with Zod schema from arbitrary prompt', () => {
    const prompt = 'A peaceful garden with glowing trees and floating crystals';
    const world = synthesizeWorldFromPrompt(prompt);

    const parseResult = WorldSpecSchema.safeParse(world);
    expect(parseResult.success).toBe(true);
    expect(world.biome).toBe('enchanted_forest');
    expect(world.mood).toBe('dream');
    expect(world.entities.length).toBeGreaterThan(0);
  });

  it('detects cyberpunk/tech keywords and configures appropriate dark/neon atmosphere', () => {
    const prompt = 'A neon futuristic cyberpunk city with flying robots and rain';
    const world = synthesizeWorldFromPrompt(prompt);

    expect(world.biome).toBe('dark_castle');
    expect(world.mood).toBe('doom');
    expect(world.audioMood).toBe('tense');
    expect(world.weather.type).toBe('rain');
    expect(WorldSpecSchema.safeParse(world).success).toBe(true);
  });

  it('detects cosmic/nebula/star keywords and configures cosmic void biome', () => {
    const prompt = 'A cosmic nebula in deep space with glowing stars';
    const world = synthesizeWorldFromPrompt(prompt);

    expect(world.biome).toBe('cosmic_void');
    expect(world.mood).toBe('surreal');
    expect(world.audioMood).toBe('mystical');
    expect(WorldSpecSchema.safeParse(world).success).toBe(true);
  });

  it('detects floating island keywords and configures floating_islands biome', () => {
    const prompt = 'High floating islands in the sky with clouds';
    const world = synthesizeWorldFromPrompt(prompt);

    expect(world.biome).toBe('floating_islands');
    expect(WorldSpecSchema.safeParse(world).success).toBe(true);
  });

  it('detects volcano/lava keywords and configures fiery atmosphere', () => {
    const prompt = 'A massive volcano with molten lava and dark towers';
    const world = synthesizeWorldFromPrompt(prompt);

    expect(world.biome).toBe('dark_castle');
    expect(world.audioMood).toBe('chaotic');
    expect(WorldSpecSchema.safeParse(world).success).toBe(true);
  });
});
