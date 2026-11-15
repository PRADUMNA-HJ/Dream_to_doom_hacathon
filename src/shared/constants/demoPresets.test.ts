import { describe, it, expect } from 'vitest';
import {
  DEMO_PRESETS,
  ENCHANTED_FOREST_PRESET_WORLD,
  CYBERPUNK_ROOFTOP_PRESET_WORLD,
  FLOATING_ISLANDS_PRESET_WORLD,
  DEMO_PRESET_WORLDS,
} from './demoPresets';
import { BiomeEnum, GameMoodEnum, WorldSpecSchema } from '../schemas/worldSchema';

describe('Demo Presets Verification', () => {
  it('contains the mandatory demo presets for the presentation', () => {
    expect(DEMO_PRESETS.length).toBeGreaterThanOrEqual(3);
    const ids = DEMO_PRESETS.map((p) => p.id);
    expect(ids).toContain('enchanted-forest');
    expect(ids).toContain('cyberpunk-rooftop');
    expect(ids).toContain('floating-islands');
  });

  it('ensures each preset has non-empty prompt transcripts', () => {
    DEMO_PRESETS.forEach((preset) => {
      expect(preset.name).toBeTruthy();
      expect(preset.icon).toBeTruthy();
      expect(preset.transcript.length).toBeGreaterThan(20);
      expect(preset.description).toBeTruthy();
    });
  });

  it('ensures all expected biomes and moods match worldSchema whitelists', () => {
    DEMO_PRESETS.forEach((preset) => {
      expect(BiomeEnum.options).toContain(preset.expectedBiome);
      expect(GameMoodEnum.options).toContain(preset.expectedMood);
    });
  });

  it('verifies exact judge demo prompt texts', () => {
    const forest = DEMO_PRESETS.find((p) => p.id === 'enchanted-forest');
    expect(forest?.transcript).toBe(
      'Create an enchanted forest with giant glowing trees, floating crystals, mysterious portals, and soft mist.'
    );

    const cyberpunk = DEMO_PRESETS.find((p) => p.id === 'cyberpunk-rooftop');
    expect(cyberpunk?.transcript).toBe(
      'Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots.'
    );

    const islands = DEMO_PRESETS.find((p) => p.id === 'floating-islands');
    expect(islands?.transcript).toBe(
      'Create an ethereal world with floating islands, glowing clouds, crystal structures, and a golden portal.'
    );
  });

  it('strictly validates all predefined preset worlds through WorldSpecSchema', () => {
    // 1. Enchanted Forest
    const forestParsed = WorldSpecSchema.safeParse(ENCHANTED_FOREST_PRESET_WORLD);
    expect(forestParsed.success).toBe(true);
    if (forestParsed.success) {
      expect(forestParsed.data.biome).toBe('enchanted_forest');
      expect(forestParsed.data.mood).toBe('dream');
      expect(forestParsed.data.audioMood).toBe('calm');
      expect(forestParsed.data.entities.length).toBeGreaterThanOrEqual(10);
    }

    // 2. Cyberpunk Rooftop
    const cyberParsed = WorldSpecSchema.safeParse(CYBERPUNK_ROOFTOP_PRESET_WORLD);
    expect(cyberParsed.success).toBe(true);
    if (cyberParsed.success) {
      expect(cyberParsed.data.biome).toBe('dark_castle');
      expect(cyberParsed.data.mood).toBe('doom');
      expect(cyberParsed.data.audioMood).toBe('tense');
      expect(cyberParsed.data.weather.type).toBe('rain');
    }

    // 3. Floating Islands
    const islandsParsed = WorldSpecSchema.safeParse(FLOATING_ISLANDS_PRESET_WORLD);
    expect(islandsParsed.success).toBe(true);
    if (islandsParsed.success) {
      expect(islandsParsed.data.biome).toBe('floating_islands');
      expect(islandsParsed.data.mood).toBe('surreal');
      expect(islandsParsed.data.audioMood).toBe('mystical');
    }

    // 4. DEMO_PRESET_WORLDS map entries
    expect(Object.keys(DEMO_PRESET_WORLDS)).toEqual([
      'enchanted-forest',
      'cyberpunk-rooftop',
      'floating-islands',
    ]);
  });
});

