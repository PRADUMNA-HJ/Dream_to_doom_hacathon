import type {
  WorldSpec,
  WorldEntity,
  BiomeType,
  GameMood,
  AudioMood,
  AssetType,
} from '../shared/schemas/worldSchema';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Pseudo-random generator seeded by prompt hash
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Intelligent on-the-spot procedural world synthesizer.
 * Dynamically analyzes ANY natural language prompt—serious, wild, surreal, or "stupid ideas"—
 * and synthesizes a fully customized, unique 3D world specification in milliseconds.
 */
export function synthesizeWorldFromPrompt(prompt: string): WorldSpec {
  const text = prompt.toLowerCase();
  const seed = hashString(prompt);
  const rand = createSeededRandom(seed);

  // 1. Biome & Mood Analysis
  let biome: BiomeType = 'enchanted_forest';
  let mood: GameMood = 'dream';
  let audioMood: AudioMood = 'calm';
  let weatherType: 'clear' | 'rain' | 'snow' | 'fog' = 'clear';

  let skyColor = '#0a192f';
  let fogColor = '#172a45';
  let groundColor = '#1b3b2b';
  let dirColor = '#64ffda';
  let ambientIntensity = 0.45;
  let dirIntensity = 1.2;

  // Custom Color Extraction from Prompt
  if (text.includes('pink') || text.includes('magenta') || text.includes('cotton candy')) {
    skyColor = '#2b0938';
    fogColor = '#4a0e4e';
    groundColor = '#380036';
    dirColor = '#f472b6';
  } else if (text.includes('gold') || text.includes('yellow') || text.includes('sun')) {
    skyColor = '#1c1917';
    fogColor = '#292524';
    groundColor = '#451a03';
    dirColor = '#f59e0b';
  } else if (text.includes('red') || text.includes('blood') || text.includes('crimson')) {
    skyColor = '#1a0505';
    fogColor = '#330a0a';
    groundColor = '#2d0606';
    dirColor = '#ef4444';
  } else if (text.includes('cyan') || text.includes('ice') || text.includes('frozen') || text.includes('snow')) {
    skyColor = '#082f49';
    fogColor = '#0c4a6e';
    groundColor = '#164e63';
    dirColor = '#38bdf8';
    weatherType = 'snow';
  } else if (text.includes('purple') || text.includes('violet')) {
    skyColor = '#1e1035';
    fogColor = '#2e1065';
    groundColor = '#3b0764';
    dirColor = '#c084fc';
  }

  // Theme & Biome Matching
  if (
    text.includes('cyber') ||
    text.includes('neon') ||
    text.includes('city') ||
    text.includes('future') ||
    text.includes('tech') ||
    text.includes('matrix') ||
    text.includes('synthwave')
  ) {
    biome = 'dark_castle';
    mood = 'doom';
    audioMood = 'tense';
    skyColor = '#030712';
    fogColor = '#0f172a';
    groundColor = '#090d16';
    dirColor = '#06b6d4';
    ambientIntensity = 0.35;
    dirIntensity = 1.4;
    weatherType = 'rain';
  } else if (
    text.includes('space') ||
    text.includes('void') ||
    text.includes('cosmic') ||
    text.includes('star') ||
    text.includes('galaxy') ||
    text.includes('nebula') ||
    text.includes('alien') ||
    text.includes('pizza') ||
    text.includes('burger') ||
    text.includes('disco') ||
    text.includes('potato')
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
    text.includes('nature') ||
    text.includes('mushroom')
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
    text.includes('floating') ||
    text.includes('cloud') ||
    text.includes('sky') ||
    text.includes('ethereal') ||
    text.includes('castle')
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
    text.includes('diamond') ||
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
    text.includes('dark') ||
    text.includes('ruins')
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
  const cleanTitle = prompt.trim().slice(0, 48);
  const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // 3. Dynamic Procedural Entity Palette Selection
  const entities: WorldEntity[] = [];

  // Determine key asset types based on keywords
  const preferredAssets: AssetType[] = [];
  if (text.includes('mushroom') || text.includes('fungus')) preferredAssets.push('mushroom');
  if (text.includes('tree') || text.includes('forest') || text.includes('nature') || text.includes('garden')) preferredAssets.push('tree');
  if (text.includes('house') || text.includes('building') || text.includes('tower') || text.includes('castle') || text.includes('city')) preferredAssets.push('house');
  if (text.includes('cloud') || text.includes('sky') || text.includes('flying')) preferredAssets.push('cloud');
  if (text.includes('lamp') || text.includes('light') || text.includes('lantern') || text.includes('neon')) preferredAssets.push('lamp');
  if (text.includes('crystal') || text.includes('gem') || text.includes('diamond') || text.includes('magic')) preferredAssets.push('crystal');
  if (text.includes('rock') || text.includes('stone') || text.includes('pyramid') || text.includes('mountain')) preferredAssets.push('rock');
  if (text.includes('robot') || text.includes('alien') || text.includes('monster') || text.includes('enemy')) preferredAssets.push('enemy');

  // Fallbacks if no specific asset mentioned
  if (preferredAssets.length === 0) {
    preferredAssets.push('crystal', 'rock', 'tree', 'lamp', 'platform');
  }

  // A. Central Monument Focal Point
  const centerAsset = preferredAssets.includes('house')
    ? 'house'
    : preferredAssets.includes('mushroom')
    ? 'mushroom'
    : 'rock';

  entities.push({
    id: `ent_center_${seed}`,
    asset: centerAsset,
    position: { x: 0, y: 0.8, z: 0 },
    rotation: { x: 0, y: Math.round(rand() * Math.PI * 100) / 100, z: 0 },
    scale: { x: 1.8, y: 1.8, z: 1.8 },
    color: dirColor,
    physics: 'fixed',
    interaction: 'none',
  });

  // B. Glowing Portal Gateway (Climax of 10s video)
  entities.push({
    id: `ent_portal_${seed}`,
    asset: 'portal',
    position: { x: 0, y: 1.5, z: -22 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 2.0, y: 2.0, z: 2.0 },
    color: dirColor,
    physics: 'sensor',
    interaction: 'portal',
  });

  // C. Curated Tour Entities (Along the 10-second camera path)
  // Shot 1 & 2 path: (0, 16, 24) -> (14, 10, 16) -> (4, 3.5, 4) -> (-7, 2.8, -6) -> (0, 7.5, -16)
  const waypoints = [
    { x: -5, y: 1.6, z: -4 },
    { x: 5, y: 2.0, z: -6 },
    { x: -7, y: 2.8, z: -13 },
    { x: 8, y: 2.5, z: -15 },
    { x: -2, y: 2.2, z: -18 },
  ];

  waypoints.forEach((wp, idx) => {
    const assetChoice = preferredAssets[idx % preferredAssets.length];
    const entityColor = idx % 2 === 0 ? dirColor : '#e040fb';

    entities.push({
      id: `ent_waypoint_${idx + 1}`,
      asset: assetChoice,
      position: { x: wp.x, y: wp.y, z: wp.z },
      rotation: { x: 0.1, y: idx * 0.9, z: 0.1 },
      scale: { x: 1.2, y: 1.3, z: 1.2 },
      color: entityColor,
      physics: 'sensor',
      interaction: 'collectible',
    });
  });

  // D. Elevated Platforms & Bridges
  const platformCoords = [
    { x: -6, y: 1.2, z: -5, sx: 4, sy: 0.6, sz: 4 },
    { x: 6, y: 1.6, z: -7, sx: 3.5, sy: 0.6, sz: 3.5 },
    { x: -7, y: 2.4, z: -13, sx: 4, sy: 0.6, sz: 4 },
    { x: 7, y: 2.0, z: -15, sx: 4, sy: 0.6, sz: 4 },
  ];

  platformCoords.forEach((p, idx) => {
    entities.push({
      id: `ent_plat_${idx + 1}`,
      asset: 'platform',
      position: { x: p.x, y: p.y, z: p.z },
      rotation: { x: 0, y: idx * 0.4, z: 0 },
      scale: { x: p.sx, y: p.sy, z: p.sz },
      color: '#334155',
      physics: 'fixed',
      interaction: 'none',
    });
  });

  // E. Surrounding Atmosphere Flora / Pillars / Structures
  const perimeterCoords = [
    { x: -14, z: -2, scale: 1.5, asset: preferredAssets[0] || 'tree' },
    { x: 14, z: -3, scale: 1.6, asset: preferredAssets[1 % preferredAssets.length] || 'tree' },
    { x: -16, z: -18, scale: 1.7, asset: preferredAssets[2 % preferredAssets.length] || 'lamp' },
    { x: 15, z: -20, scale: 1.8, asset: preferredAssets[3 % preferredAssets.length] || 'rock' },
    { x: -10, z: 12, scale: 1.4, asset: preferredAssets[0] || 'tree' },
    { x: 11, z: 14, scale: 1.5, asset: preferredAssets[1 % preferredAssets.length] || 'mushroom' },
  ];

  perimeterCoords.forEach((item, idx) => {
    entities.push({
      id: `ent_perim_${idx + 1}`,
      asset: item.asset,
      position: { x: item.x, y: item.asset === 'cloud' ? 6 : 0, z: item.z },
      rotation: { x: 0, y: idx * 1.2, z: 0 },
      scale: { x: item.scale, y: item.scale * 1.3, z: item.scale },
      color: dirColor,
      physics: 'fixed',
      interaction: 'none',
    });
  });

  return {
    id: `world-synth-${Date.now()}`,
    title: formattedTitle || 'Imagined 3D Showcase',
    description: `A 10-second cinematic video tour created on the spot from: "${prompt}".`,
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
