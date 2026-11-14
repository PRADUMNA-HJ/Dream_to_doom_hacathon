import type { BiomeType, GameMood } from '../schemas/worldSchema';

export interface DemoPreset {
  id: string;
  name: string;
  icon: string;
  transcript: string;
  expectedBiome: BiomeType;
  expectedMood: GameMood;
  description: string;
}

export const DEMO_PRESETS: readonly DemoPreset[] = [
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    icon: '🌿',
    transcript:
      'Create an enchanted forest with giant glowing trees, floating crystals, mysterious portals, and soft mist.',
    expectedBiome: 'enchanted_forest',
    expectedMood: 'dream',
    description: 'Bioluminescent flora, calm ambient pentatonic pads, crystals and collectibles.',
  },
  {
    id: 'cyberpunk-rooftop',
    name: 'Cyberpunk Rooftop',
    icon: '🏙️',
    transcript:
      'Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots.',
    expectedBiome: 'dark_castle',
    expectedMood: 'doom',
    description: 'Rain atmosphere, tense minor audio scales, hazard drones and platforming.',
  },
  {
    id: 'floating-islands',
    name: 'Floating Islands',
    icon: '☁️',
    transcript:
      'Create an ethereal world with floating islands, glowing clouds, crystal structures, and a golden portal.',
    expectedBiome: 'floating_islands',
    expectedMood: 'surreal',
    description: 'Verticality, floating cloud platforms, and mystical ambient soundscape.',
  },
] as const;

