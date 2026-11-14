import { describe, it, expect } from 'vitest';
import { DEMO_PRESETS } from './demoPresets';
import { BiomeEnum, GameMoodEnum } from '../schemas/worldSchema';

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
  });
});
