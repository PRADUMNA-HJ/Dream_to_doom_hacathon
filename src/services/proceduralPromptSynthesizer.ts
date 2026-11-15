import type {
  WorldSpec,
  WorldEntity,
  BiomeType,
  GameMood,
  AudioMood,
  WeatherType,
  AssetType,
} from '../shared/schemas/worldSchema';

/**
 * On-the-spot Procedural World Synthesizer
 * Converts any spoken or typed prompt (from serious concepts to wild/crazy ideas)
 * into a rich, unmistakably themed 3D scene ready for a 10-second cinematic video showcase.
 */
export function synthesizeWorldFromPrompt(prompt: string): WorldSpec {
  const text = prompt.toLowerCase();

  // Generate numeric seed from prompt string
  let seed = 0;
  for (let i = 0; i < prompt.length; i++) {
    seed = (seed << 5) - seed + prompt.charCodeAt(i);
    seed |= 0;
  }

  // 1. Theme, Biome & Atmosphere Classification
  let biome: BiomeType = 'enchanted_forest';
  let mood: GameMood = 'dream';
  let audioMood: AudioMood = 'calm';
  let skyColor = '#0a192f';
  let fogColor = '#172a45';
  let groundColor = '#1b3b2b';
  let dirColor = '#64ffda';
  let ambientIntensity = 0.45;
  let dirIntensity = 1.2;
  let weatherType: WeatherType = 'clear';

  const isChase =
    text.includes('dog') ||
    text.includes('boy') ||
    text.includes('chase') ||
    text.includes('puppy') ||
    text.includes('kid') ||
    text.includes('pet');

  if (isChase) {
    biome = 'enchanted_forest';
    mood = 'dream';
    audioMood = 'calm';
    skyColor = '#38bdf8';
    fogColor = '#bae6fd';
    groundColor = '#16a34a';
    dirColor = '#fef08a';
    ambientIntensity = 0.65;
    dirIntensity = 1.4;
    weatherType = 'clear';
  } else if (
    text.includes('dragon') ||
    text.includes('monster') ||
    text.includes('dinosaur')
  ) {
    biome = 'dark_castle';
    mood = 'doom';
    audioMood = 'chaotic';
    skyColor = '#1a0505';
    fogColor = '#3b0707';
    groundColor = '#1c1917';
    dirColor = '#ff4500';
    ambientIntensity = 0.45;
    dirIntensity = 1.6;
    weatherType = 'fog';
  } else if (
    text.includes('cyber') ||
    text.includes('neon') ||
    text.includes('city') ||
    text.includes('future') ||
    text.includes('tech') ||
    text.includes('matrix') ||
    text.includes('synthwave') ||
    text.includes('rooftop') ||
    text.includes('drone')
  ) {
    biome = 'dark_castle';
    mood = 'doom';
    audioMood = 'tense';
    skyColor = '#030712';
    fogColor = '#0f172a';
    groundColor = '#0a0e17';
    dirColor = '#00e5ff';
    ambientIntensity = 0.4;
    dirIntensity = 1.5;
    weatherType = text.includes('rain') || !text.includes('clear') ? 'rain' : 'clear';
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
    text.includes('potato') ||
    text.includes('stupid')
  ) {
    biome = 'cosmic_void';
    mood = 'surreal';
    audioMood = 'mystical';
    skyColor = '#02000d';
    fogColor = '#0d0426';
    groundColor = '#130e29';
    dirColor = '#d500f9';
    ambientIntensity = 0.55;
    dirIntensity = 1.2;
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
    groundColor = '#143022';
    dirColor = '#10b981';
    ambientIntensity = 0.5;
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
    groundColor = '#24143d';
    dirColor = '#e040fb';
    ambientIntensity = 0.35;
    dirIntensity = 1.5;
    weatherType = 'fog';
  } else if (
    text.includes('island') ||
    text.includes('floating') ||
    text.includes('cloud') ||
    text.includes('sky') ||
    text.includes('ethereal') ||
    text.includes('heaven')
  ) {
    biome = 'floating_islands';
    mood = 'surreal';
    audioMood = 'mystical';
    skyColor = '#1a365d';
    fogColor = '#2b6cb0';
    groundColor = '#234e70';
    dirColor = '#facc15';
    ambientIntensity = 0.6;
    dirIntensity = 1.3;
    weatherType = 'clear';
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
    ambientIntensity = 0.45;
    dirIntensity = 1.6;
    weatherType = 'fog';
  } else if (
    text.includes('desert') ||
    text.includes('pyramid') ||
    text.includes('ruin') ||
    text.includes('sand') ||
    text.includes('dune')
  ) {
    biome = 'desert_ruins';
    mood = 'mystery';
    audioMood = 'mystical';
    skyColor = '#291b0f';
    fogColor = '#4a2f16';
    groundColor = '#8c6239';
    dirColor = '#f59e0b';
    ambientIntensity = 0.55;
    dirIntensity = 1.4;
    weatherType = 'clear';
  } else {
    // Default: Enchanted Nature / Forest
    biome = 'enchanted_forest';
    mood = 'dream';
    audioMood = 'calm';
    skyColor = '#0a192f';
    fogColor = '#172a45';
    groundColor = '#143022';
    dirColor = '#10b981';
    ambientIntensity = 0.5;
    dirIntensity = 1.3;
    weatherType = 'clear';
  }

  // 2. Synthesize Display Title
  const cleanTitle = prompt.trim().slice(0, 48);
  const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // 3. Dense Thematic Entity Generation
  const entities: WorldEntity[] = [];

  // A. Portal Gateway at the climax of the 10-second tour (z = -22)
  entities.push({
    id: `ent_portal_${seed}`,
    asset: 'portal',
    position: { x: 0, y: 1.8, z: -22 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 2.2, y: 2.2, z: 2.2 },
    color: dirColor,
    physics: 'sensor',
    interaction: 'portal',
  });

  if (isChase) {
    // Beautiful park trees lining both sides of the running pathway
    const parkTrees = [
      { x: -5.5, z: 4, s: 1.7 },
      { x: 5.5, z: 2, s: 1.8 },
      { x: -6.0, z: -4, s: 1.9 },
      { x: 6.0, z: -6, s: 1.8 },
      { x: -5.5, z: -12, s: 2.0 },
      { x: 5.5, z: -14, s: 1.9 },
      { x: -6.0, z: -20, s: 1.8 },
      { x: 6.0, z: -20, s: 1.8 },
    ];
    parkTrees.forEach((t, idx) => {
      entities.push({
        id: `park_tree_${idx + 1}`,
        asset: 'tree',
        position: { x: t.x, y: 0, z: t.z },
        rotation: { x: 0, y: idx * 0.9, z: 0 },
        scale: { x: t.s, y: t.s * 1.2, z: t.s },
        color: '#22c55e',
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Park lampposts along the walkway
    const parkLamps = [
      { x: -3.2, z: 3 },
      { x: 3.2, z: -5 },
      { x: -3.2, z: -13 },
      { x: 3.2, z: -19 },
    ];
    parkLamps.forEach((l, idx) => {
      entities.push({
        id: `park_lamp_${idx + 1}`,
        asset: 'lamp',
        position: { x: l.x, y: 0, z: l.z },
        rotation: { x: 0, y: idx * 0.5, z: 0 },
        scale: { x: 0.9, y: 1.1, z: 0.9 },
        color: '#fef08a',
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Park benches
    entities.push(
      {
        id: 'park_bench_1',
        asset: 'platform',
        position: { x: -3.8, y: 0.3, z: -2 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        scale: { x: 1.2, y: 0.3, z: 0.6 },
        color: '#78350f',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'park_bench_2',
        asset: 'platform',
        position: { x: 3.8, y: 0.3, z: -10 },
        rotation: { x: 0, y: -Math.PI / 2, z: 0 },
        scale: { x: 1.2, y: 0.3, z: 0.6 },
        color: '#78350f',
        physics: 'fixed',
        interaction: 'none',
      }
    );
  } else if (biome === 'dark_castle') {
    // --- CYBERPUNK METROPOLIS / HIGH-TECH ROOFTOP ---
    // High-rise towers right on the rooftop flanks
    entities.push(
      {
        id: 'cyber_tower_left',
        asset: 'house', // Rendered as high-tech skyscraper with glowing windows & comms spire
        position: { x: -14, y: 0, z: -8 },
        rotation: { x: 0, y: 0.3, z: 0 },
        scale: { x: 1.8, y: 2.2, z: 1.8 },
        color: '#00e5ff',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cyber_tower_right',
        asset: 'house',
        position: { x: 14, y: 0, z: -10 },
        rotation: { x: 0, y: -0.4, z: 0 },
        scale: { x: 1.6, y: 2.5, z: 1.6 },
        color: '#e040fb',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cyber_spire_center_back',
        asset: 'house',
        position: { x: -6, y: 0, z: -20 },
        rotation: { x: 0, y: 0.1, z: 0 },
        scale: { x: 1.4, y: 2.8, z: 1.4 },
        color: '#ffd600',
        physics: 'fixed',
        interaction: 'none',
      }
    );

    // Elevated Helipad & Catwalk Platforms with Neon Edge Trims
    entities.push(
      {
        id: 'cyber_helipad_core',
        asset: 'platform',
        position: { x: 0, y: 0.2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2.5, y: 0.5, z: 2.5 },
        color: '#00e5ff',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cyber_catwalk_forward',
        asset: 'platform',
        position: { x: 0, y: 1.0, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.5, y: 0.4, z: 2.2 },
        color: '#e040fb',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cyber_catwalk_left',
        asset: 'platform',
        position: { x: -7, y: 1.8, z: -14 },
        rotation: { x: 0, y: 0.3, z: 0 },
        scale: { x: 1.8, y: 0.4, z: 1.8 },
        color: '#00e5ff',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cyber_catwalk_right',
        asset: 'platform',
        position: { x: 7, y: 1.8, z: -14 },
        rotation: { x: 0, y: -0.3, z: 0 },
        scale: { x: 1.8, y: 0.4, z: 1.8 },
        color: '#ffd600',
        physics: 'fixed',
        interaction: 'none',
      }
    );

    // Holographic Neon Street Light Poles
    const lampCoords = [
      { x: -5, z: 2, c: '#00e5ff' },
      { x: 5, z: 2, c: '#e040fb' },
      { x: -4, z: -7, c: '#00e5ff' },
      { x: 4, z: -7, c: '#ffd600' },
      { x: -3, z: -16, c: '#e040fb' },
      { x: 3, z: -16, c: '#00e5ff' },
    ];
    lampCoords.forEach((l, idx) => {
      entities.push({
        id: `cyber_lamp_${idx + 1}`,
        asset: 'lamp',
        position: { x: l.x, y: 0, z: l.z },
        rotation: { x: 0, y: idx * 0.5, z: 0 },
        scale: { x: 1, y: 1.2, z: 1 },
        color: l.c,
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Cyber Surveillance Drones Hovering Overhead
    entities.push(
      {
        id: 'cyber_drone_1',
        asset: 'enemy',
        position: { x: -4, y: 4.2, z: -4 },
        rotation: { x: 0, y: 0.4, z: 0 },
        scale: { x: 1.3, y: 1.3, z: 1.3 },
        color: '#ff0055',
        physics: 'fixed',
        interaction: 'hazard',
      },
      {
        id: 'cyber_drone_2',
        asset: 'enemy',
        position: { x: 5, y: 5.0, z: -12 },
        rotation: { x: 0, y: -0.6, z: 0 },
        scale: { x: 1.4, y: 1.4, z: 1.4 },
        color: '#ff0055',
        physics: 'fixed',
        interaction: 'hazard',
      }
    );

    // Glowing Neon Cyber Data Crystals / Power Cells
    entities.push(
      {
        id: 'cyber_core_1',
        asset: 'crystal',
        position: { x: 0, y: 1.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1.5, z: 1.2 },
        color: '#00e5ff',
        physics: 'sensor',
        interaction: 'collectible',
      },
      {
        id: 'cyber_core_2',
        asset: 'crystal',
        position: { x: -7, y: 2.8, z: -14 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.3, y: 1.3, z: 1.3 },
        color: '#e040fb',
        physics: 'sensor',
        interaction: 'collectible',
      },
      {
        id: 'cyber_core_3',
        asset: 'crystal',
        position: { x: 7, y: 2.8, z: -14 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.3, y: 1.3, z: 1.3 },
        color: '#ffd600',
        physics: 'sensor',
        interaction: 'collectible',
      }
    );
  } else if (biome === 'cosmic_void') {
    // --- COSMIC NEBULA / DEEP SPACE / CRAZY IDEAS ---
    // Floating cosmic asteroid platforms
    const cosmicWaypoints = [
      { x: -5, y: 2.0, z: -5, s: 1.6, asset: 'crystal' as AssetType, c: '#d500f9' },
      { x: 5, y: 3.2, z: -8, s: 1.8, asset: 'rock' as AssetType, c: '#7c3aed' },
      { x: -7, y: 3.8, z: -13, s: 2.0, asset: 'enemy' as AssetType, c: '#ec4899' },
      { x: 7, y: 4.2, z: -16, s: 1.9, asset: 'crystal' as AssetType, c: '#38bdf8' },
      { x: 0, y: 2.2, z: 0, s: 2.2, asset: 'crystal' as AssetType, c: '#a855f7' },
    ];

    cosmicWaypoints.forEach((cw, idx) => {
      entities.push({
        id: `cosmic_node_${idx + 1}`,
        asset: cw.asset,
        position: { x: cw.x, y: cw.y, z: cw.z },
        rotation: { x: idx * 0.3, y: idx * 0.7, z: idx * 0.2 },
        scale: { x: cw.s, y: cw.s, z: cw.s },
        color: cw.c,
        physics: 'sensor',
        interaction: 'collectible',
      });
    });

    // Floating Cosmic Stepping Platforms
    const platCoords = [
      { x: 0, y: 0.5, z: 0, sx: 2.5, sz: 2.5 },
      { x: -4, y: 1.4, z: -6, sx: 2.0, sz: 2.0 },
      { x: 4, y: 2.2, z: -11, sx: 2.0, sz: 2.0 },
      { x: -3, y: 2.8, z: -17, sx: 2.2, sz: 2.2 },
    ];
    platCoords.forEach((p, idx) => {
      entities.push({
        id: `cosmic_plat_${idx + 1}`,
        asset: 'platform',
        position: { x: p.x, y: p.y, z: p.z },
        rotation: { x: 0.05, y: idx * 0.4, z: 0 },
        scale: { x: p.sx, y: 0.4, z: p.sz },
        color: '#4c1d95',
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Cosmic Gas Clouds
    entities.push(
      {
        id: 'cosmic_cloud_1',
        asset: 'cloud',
        position: { x: -12, y: 6, z: -10 },
        rotation: { x: 0, y: 0.5, z: 0 },
        scale: { x: 2.5, y: 2.0, z: 2.5 },
        color: '#d500f9',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'cosmic_cloud_2',
        asset: 'cloud',
        position: { x: 12, y: 7, z: -18 },
        rotation: { x: 0, y: -0.3, z: 0 },
        scale: { x: 2.8, y: 2.2, z: 2.8 },
        color: '#38bdf8',
        physics: 'fixed',
        interaction: 'none',
      }
    );
  } else {
    // --- ENCHANTED FOREST / MUSHROOM KINGDOM / NATURE ---
    // Giant Bioluminescent Mushrooms
    const mushroomCoords = [
      { x: -6, z: -3, s: 1.8, c: '#ec4899' },
      { x: 6, z: -5, s: 2.2, c: '#38bdf8' },
      { x: -8, z: -12, s: 2.4, c: '#a855f7' },
      { x: 8, z: -15, s: 2.0, c: '#ec4899' },
      { x: 0, z: -1, s: 1.6, c: '#34d399' },
    ];
    mushroomCoords.forEach((m, idx) => {
      entities.push({
        id: `forest_mush_${idx + 1}`,
        asset: 'mushroom',
        position: { x: m.x, y: 0, z: m.z },
        rotation: { x: 0, y: idx * 0.8, z: 0 },
        scale: { x: m.s, y: m.s * 1.2, z: m.s },
        color: m.c,
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Ancient Glowing Trees
    const treeCoords = [
      { x: -12, z: -6, s: 1.8 },
      { x: 12, z: -8, s: 2.0 },
      { x: -14, z: -18, s: 2.2 },
      { x: 14, z: -20, s: 2.1 },
      { x: -9, z: 8, s: 1.7 },
      { x: 9, z: 8, s: 1.7 },
    ];
    treeCoords.forEach((t, idx) => {
      entities.push({
        id: `forest_tree_${idx + 1}`,
        asset: 'tree',
        position: { x: t.x, y: 0, z: t.z },
        rotation: { x: 0, y: idx * 1.1, z: 0 },
        scale: { x: t.s, y: t.s * 1.3, z: t.s },
        color: '#10b981',
        physics: 'fixed',
        interaction: 'none',
      });
    });

    // Glowing Mana Crystals
    const crystalCoords = [
      { x: -4, y: 1.4, z: -6, c: '#64ffda' },
      { x: 4, y: 1.6, z: -8, c: '#38bdf8' },
      { x: -2, y: 2.0, z: -15, c: '#ec4899' },
    ];
    crystalCoords.forEach((cr, idx) => {
      entities.push({
        id: `forest_crystal_${idx + 1}`,
        asset: 'crystal',
        position: { x: cr.x, y: cr.y, z: cr.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1.4, z: 1.2 },
        color: cr.c,
        physics: 'sensor',
        interaction: 'collectible',
      });
    });

    // Natural Stepping Platforms
    entities.push(
      {
        id: 'forest_plat_1',
        asset: 'platform',
        position: { x: -4, y: 0.8, z: -6 },
        rotation: { x: 0, y: 0.2, z: 0 },
        scale: { x: 1.8, y: 0.4, z: 1.8 },
        color: '#1e3a2f',
        physics: 'fixed',
        interaction: 'none',
      },
      {
        id: 'forest_plat_2',
        asset: 'platform',
        position: { x: 4, y: 1.2, z: -8 },
        rotation: { x: 0, y: -0.2, z: 0 },
        scale: { x: 1.8, y: 0.4, z: 1.8 },
        color: '#1e3a2f',
        physics: 'fixed',
        interaction: 'none',
      }
    );
  }

  // 4. Return validated WorldSpec
  return {
    id: `world-synth-${Math.abs(seed)}`,
    title: formattedTitle,
    description: `A 10-second cinematic video tour created on the spot from: "${prompt}".`,
    biome,
    mood,
    audioMood,
    environment: {
      skyColor,
      fogColor,
      groundColor,
      fogDensity: biome === 'dark_castle' ? 0.025 : 0.015,
    },
    lighting: {
      ambientIntensity,
      directionalIntensity: dirIntensity,
      directionalColor: dirColor,
    },
    weather: {
      type: weatherType,
      intensity: 0.8,
    },
    spawnPoint: {
      x: 0,
      y: 1.5,
      z: 0,
    },
    entities,
  };
}
