import type {
  WorldSpec,
  WorldEntity,
  BiomeType,
  GameMood,
  AudioMood,
} from '../shared/schemas/worldSchema';

/**
 * Intelligent procedural world synthesizer that parses natural language prompt keywords
 * to dynamically create a customized, fully validated 3D world specification.
 * Acts as an offline fallback when Gemini API key is not configured or network is unavailable.
 */
export function synthesizeWorldFromPrompt(prompt: string): WorldSpec {
  const text = prompt.toLowerCase();

  // 1. Determine Biome & Mood from keywords
  let biome: BiomeType = 'enchanted_forest';
  let mood: GameMood = 'dream';
  let audioMood: AudioMood = 'calm';

  let skyColor = '#0a192f';
  let fogColor = '#172a45';
  let groundColor = '#1b3b2b';
  let dirColor = '#64ffda';
  let ambientIntensity = 0.45;
  let dirIntensity = 1.2;
  let weatherType: 'clear' | 'rain' | 'snow' | 'fog' = 'clear';

  if (
    text.includes('cyber') ||
    text.includes('neon') ||
    text.includes('city') ||
    text.includes('future') ||
    text.includes('tech') ||
    text.includes('robot')
  ) {
    biome = 'dark_castle';
    mood = 'doom';
    audioMood = 'tense';
    skyColor = '#050510';
    fogColor = '#120c24';
    groundColor = '#0d1117';
    dirColor = '#00e5ff';
    ambientIntensity = 0.35;
    dirIntensity = 1.4;
    weatherType = 'rain';
  } else if (
    text.includes('space') ||
    text.includes('void') ||
    text.includes('cosmic') ||
    text.includes('star') ||
    text.includes('galaxy') ||
    text.includes('nebula')
  ) {
    biome = 'cosmic_void';
    mood = 'surreal';
    audioMood = 'mystical';
    skyColor = '#02000d';
    fogColor = '#0d0426';
    groundColor = '#130e29';
    dirColor = '#d500f9';
    ambientIntensity = 0.5;
    dirIntensity = 1.1;
    weatherType = 'fog';
  } else if (
    text.includes('forest') ||
    text.includes('garden') ||
    text.includes('tree') ||
    text.includes('grove') ||
    text.includes('wood') ||
    text.includes('nature')
  ) {
    biome = 'enchanted_forest';
    mood = 'dream';
    audioMood = 'calm';
    skyColor = '#0a192f';
    fogColor = '#172a45';
    groundColor = '#1b3b2b';
    dirColor = '#64ffda';
    ambientIntensity = 0.45;
    dirIntensity = 1.2;
    weatherType = 'clear';
  } else if (
    text.includes('island') ||
    text.includes('floating island') ||
    text.includes('cloud') ||
    text.includes('sky world') ||
    text.includes('ethereal')
  ) {
    biome = 'floating_islands';
    mood = 'surreal';
    audioMood = 'mystical';
    skyColor = '#1a365d';
    fogColor = '#2b6cb0';
    groundColor = '#2c5282';
    dirColor = '#f6e05e';
    ambientIntensity = 0.6;
    dirIntensity = 1.3;
    weatherType = 'clear';
  } else if (
    text.includes('crystal') ||
    text.includes('cave') ||
    text.includes('gem') ||
    text.includes('underground') ||
    text.includes('mine')
  ) {
    biome = 'crystal_cave';
    mood = 'mystery';
    audioMood = 'mystical';
    skyColor = '#0f051d';
    fogColor = '#1e0836';
    groundColor = '#2d1b4e';
    dirColor = '#e040fb';
    ambientIntensity = 0.3;
    dirIntensity = 1.5;
    weatherType = 'fog';
  } else if (
    text.includes('volcano') ||
    text.includes('lava') ||
    text.includes('fire') ||
    text.includes('doom') ||
    text.includes('hell') ||
    text.includes('dark')
  ) {
    biome = 'dark_castle';
    mood = 'doom';
    audioMood = 'chaotic';
    skyColor = '#1a0505';
    fogColor = '#330a0a';
    groundColor = '#1f0d0d';
    dirColor = '#ff3d00';
    ambientIntensity = 0.4;
    dirIntensity = 1.6;
    weatherType = 'fog';
  }

  // 2. Synthesize Title
  const cleanTitle = prompt.trim().slice(0, 42);
  const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // 3. Procedural Entities layout
  const entities: WorldEntity[] = [];

  // Central Rock / Monument
  entities.push({
    id: `ent_center_${Date.now()}`,
    asset: 'rock',
    position: { x: 0, y: 0.8, z: 0 },
    rotation: { x: 0, y: 0.3, z: 0 },
    scale: { x: 1.5, y: 1.5, z: 1.5 },
    color: '#38bdf8',
    physics: 'fixed',
    interaction: 'none',
  });

  // Glowing Gateway Portal
  entities.push({
    id: `ent_portal_${Date.now()}`,
    asset: 'portal',
    position: { x: 0, y: 1.5, z: -22 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1.8, y: 1.8, z: 1.8 },
    color: dirColor,
    physics: 'sensor',
    interaction: 'portal',
  });

  // Floating Crystals (5 collectibles placed along cinematic tour line)
  const crystalCoords = [
    { x: -5, y: 1.8, z: -4, color: '#00e5ff' },
    { x: 5, y: 2.2, z: -6, color: '#e040fb' },
    { x: -7, y: 3.2, z: -14, color: '#76ff03' },
    { x: 8, y: 2.8, z: -16, color: '#ffd600' },
    { x: 0, y: 2.5, z: -18, color: '#ff4081' },
  ];

  crystalCoords.forEach((c, idx) => {
    entities.push({
      id: `ent_crystal_${idx + 1}`,
      asset: 'crystal',
      position: { x: c.x, y: c.y, z: c.z },
      rotation: { x: 0.1, y: idx * 0.8, z: 0.1 },
      scale: { x: 1.1, y: 1.3, z: 1.1 },
      color: c.color,
      physics: 'sensor',
      interaction: 'collectible',
    });
  });

  // Elevated Stone Platforms
  const platformCoords = [
    { x: -6, y: 1.2, z: -5, sx: 4, sy: 0.6, sz: 4 },
    { x: 6, y: 1.8, z: -7, sx: 3.5, sy: 0.6, sz: 3.5 },
    { x: -7, y: 2.6, z: -14, sx: 4, sy: 0.6, sz: 4 },
    { x: 7, y: 2.2, z: -15, sx: 4, sy: 0.6, sz: 4 },
  ];

  platformCoords.forEach((p, idx) => {
    entities.push({
      id: `ent_plat_${idx + 1}`,
      asset: 'platform',
      position: { x: p.x, y: p.y, z: p.z },
      rotation: { x: 0, y: idx * 0.4, z: 0 },
      scale: { x: p.sx, y: p.sy, z: p.sz },
      color: '#475569',
      physics: 'fixed',
      interaction: 'none',
    });
  });

  // Atmospheric Flora / Glowing Trees / Columns
  const treeCoords = [
    { x: -14, z: -2, scale: 1.4, color: '#10b981' },
    { x: 14, z: -3, scale: 1.6, color: '#06b6d4' },
    { x: -16, z: -18, scale: 1.5, color: '#8b5cf6' },
    { x: 15, z: -20, scale: 1.7, color: '#ec4899' },
    { x: -10, z: 10, scale: 1.3, color: '#3b82f6' },
    { x: 11, z: 12, scale: 1.4, color: '#14b8a6' },
  ];

  treeCoords.forEach((t, idx) => {
    entities.push({
      id: `ent_tree_${idx + 1}`,
      asset: 'tree',
      position: { x: t.x, y: 0, z: t.z },
      rotation: { x: 0, y: idx * 1.1, z: 0 },
      scale: { x: t.scale, y: t.scale * 1.3, z: t.scale },
      color: t.color,
      physics: 'fixed',
      interaction: 'none',
    });
  });

  // Dynamic Hazard Entity
  entities.push({
    id: `ent_hazard_${Date.now()}`,
    asset: 'enemy',
    position: { x: -2, y: 1.2, z: -11 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1.2, y: 1.2, z: 1.2 },
    color: '#f43f5e',
    physics: 'sensor',
    interaction: 'hazard',
  });

  return {
    id: `world-synth-${Date.now()}`,
    title: formattedTitle || 'Imagined Realm',
    description: `A 10-second cinematic showcase generated from: "${prompt}".`,
    biome,
    mood,
    audioMood,
    environment: {
      skyColor,
      fogColor,
      groundColor,
      fogDensity: 0.02,
    },
    lighting: {
      ambientIntensity,
      directionalIntensity: dirIntensity,
      directionalColor: dirColor,
    },
    weather: {
      type: weatherType,
      intensity: 0.6,
    },
    spawnPoint: { x: 0, y: 0.5, z: 6 },
    entities,
  };
}
