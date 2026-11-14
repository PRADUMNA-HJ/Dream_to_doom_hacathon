/**
 * Dream-to-Doom: Sensory Domain — Audio Configuration & Preset Definitions
 * Contains musical scale mappings, ADSR envelopes, master bus defaults,
 * ambient drone synthesizer parameters, and sound effect definitions.
 */

import type {
  AmbientPresetConfig,
  AmbientPresetType,
  AudioMoodConfig,
  GameAudioEventMeta,
  GameAudioEventType,
  MasterAudioBusConfig,
  MusicalScaleType,
  SoundEffectPresetConfig,
} from '../types/audio.types';

// ============================================================================
// 1. Master Audio Bus Defaults
// ============================================================================

export const DEFAULT_MASTER_AUDIO_CONFIG: MasterAudioBusConfig = {
  defaultVolume: 0.75,
  minVolume: 0.0,
  maxVolume: 1.0,
  limiterThresholdDb: -0.5,
  compressorThresholdDb: -18.0,
  compressorRatio: 4.0,
  fadeRampTimeSec: 0.4,
};

/** Alias for DEFAULT_MASTER_AUDIO_CONFIG for bus configuration naming consistency */
export const DEFAULT_MASTER_BUS_CONFIG = DEFAULT_MASTER_AUDIO_CONFIG;

export const DEFAULT_AUDIO_MOOD: AudioMoodConfig = {
  tempo: 120,
  scale: 'minor',
  ambientPreset: 'ethereal_drone',
  reverbDecay: 2.5,
};

// ============================================================================
// 2. Musical Scale Frequency & Note Maps
// ============================================================================

/**
 * Standard note collections across octaves for generative melody & ambient harmonization.
 * Scales: Major, Minor, Pentatonic, Diminished
 */
export const MUSICAL_SCALES: Record<MusicalScaleType, string[]> = {
  major: [
    'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
    'C5', 'D5', 'E5', 'G5',
  ],
  minor: [
    'C3', 'D3', 'Eb3', 'F3', 'G3', 'Ab3', 'Bb3',
    'C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4',
    'C5', 'D5', 'Eb5', 'G5',
  ],
  pentatonic: [
    'C3', 'Eb3', 'F3', 'G3', 'Bb3',
    'C4', 'Eb4', 'F4', 'G4', 'Bb4',
    'C5', 'Eb5', 'F5', 'G5', 'Bb5',
  ],
  diminished: [
    'C3', 'D3', 'Eb3', 'F3', 'Gb3', 'Ab3', 'A3', 'B3',
    'C4', 'D4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'A4', 'B4',
    'C5', 'Eb5', 'Gb5',
  ],
};

/** Alias for MUSICAL_SCALES for scale mapping naming consistency */
export const AUDIO_MOOD_SCALES = MUSICAL_SCALES;

// ============================================================================
// 3. Ambient Preset Configurations (Drone & Atmosphere)
// ============================================================================

export const AMBIENT_PRESETS: Record<AmbientPresetType, AmbientPresetConfig> = {
  ethereal_drone: {
    name: 'ethereal_drone',
    displayName: 'Ethereal Cosmic Drone',
    droneNotes: ['C2', 'G2', 'Eb3', 'Bb3'],
    filterType: 'lowpass',
    filterFrequency: 650,
    filterQ: 2.5,
    volumeDb: -12,
    modulationSpeedHz: 0.15,
    lfoDepth: 250,
    chorusDepth: 0.6,
  },
  dystopian_drone: {
    name: 'dystopian_drone',
    displayName: 'Dystopian Industrial Drone',
    droneNotes: ['C1', 'F#1', 'C2', 'Eb2'],
    filterType: 'lowpass',
    filterFrequency: 420,
    filterQ: 4.0,
    volumeDb: -10,
    modulationSpeedHz: 0.08,
    lfoDepth: 180,
    chorusDepth: 0.4,
  },
  cyber_ambience: {
    name: 'cyber_ambience',
    displayName: 'Cyberpunk Neon Atmosphere',
    droneNotes: ['D2', 'A2', 'F3', 'C4'],
    filterType: 'bandpass',
    filterFrequency: 850,
    filterQ: 1.8,
    volumeDb: -11,
    modulationSpeedHz: 0.25,
    lfoDepth: 350,
    chorusDepth: 0.7,
  },
  nature_breeze: {
    name: 'nature_breeze',
    displayName: 'Organic Nature Atmosphere',
    droneNotes: ['G2', 'D3', 'B3', 'E4'],
    filterType: 'lowpass',
    filterFrequency: 900,
    filterQ: 1.2,
    volumeDb: -14,
    modulationSpeedHz: 0.35,
    lfoDepth: 400,
    chorusDepth: 0.5,
  },
  volcanic_rumble: {
    name: 'volcanic_rumble',
    displayName: 'Volcanic Core Sub-Rumble',
    droneNotes: ['A0', 'E1', 'A1', 'C2'],
    filterType: 'lowpass',
    filterFrequency: 220,
    filterQ: 5.0,
    volumeDb: -8,
    modulationSpeedHz: 0.05,
    lfoDepth: 90,
    chorusDepth: 0.2,
  },
  void_silence: {
    name: 'void_silence',
    displayName: 'Deep Void (Minimal)',
    droneNotes: ['C1'],
    filterType: 'lowpass',
    filterFrequency: 150,
    filterQ: 1.0,
    volumeDb: -24,
    modulationSpeedHz: 0.02,
    lfoDepth: 40,
    chorusDepth: 0.1,
  },
};

// ============================================================================
// 4. Procedural Sound Effect Presets
// ============================================================================

export const SOUND_EFFECT_PRESETS: Record<GameAudioEventType, SoundEffectPresetConfig> = {
  world_generation_started: {
    oscillatorType: 'sine',
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.2, release: 1.2 },
    baseNotes: ['C4', 'E4', 'G4', 'B4', 'C5'],
    volumeDb: -4,
    pitchDecay: 0.1,
    octaves: 2,
  },
  object_spawned: {
    oscillatorType: 'triangle',
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.0, release: 0.1 },
    baseNotes: ['G4', 'C5'],
    volumeDb: -6,
    pitchDecay: 0.05,
  },
  tree_generated: {
    oscillatorType: 'triangle',
    envelope: { attack: 0.02, decay: 0.28, sustain: 0.05, release: 0.25 },
    baseNotes: ['E3', 'G3', 'B3'],
    volumeDb: -5,
  },
  building_generated: {
    oscillatorType: 'sawtooth',
    envelope: { attack: 0.01, decay: 0.35, sustain: 0.1, release: 0.3 },
    baseNotes: ['C2', 'G2', 'C3'],
    volumeDb: -5,
    pitchDecay: 0.08,
  },
  enemy_spawned: {
    oscillatorType: 'sawtooth',
    envelope: { attack: 0.03, decay: 0.45, sustain: 0.25, release: 0.5 },
    baseNotes: ['Eb2', 'A2', 'D3'],
    volumeDb: -3,
    pitchDecay: 0.15,
  },
  object_destroyed: {
    oscillatorType: 'square',
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.0, release: 0.2 },
    baseNotes: ['F2', 'C2', 'G1'],
    volumeDb: -4,
    pitchDecay: 0.2,
    octaves: 3,
  },
  environment_changed: {
    oscillatorType: 'sine',
    envelope: { attack: 0.4, decay: 0.6, sustain: 0.4, release: 1.5 },
    baseNotes: ['D3', 'A3', 'F4', 'C5'],
    volumeDb: -6,
  },
  world_generation_completed: {
    oscillatorType: 'triangle',
    envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.8 },
    baseNotes: ['C4', 'G4', 'C5', 'E5', 'G5'],
    volumeDb: -3,
  },
};

// ============================================================================
// 5. Game Audio Event Metadata Table
// ============================================================================

export const GAME_AUDIO_EVENTS_META: readonly GameAudioEventMeta[] = [
  {
    type: 'world_generation_started',
    label: 'World Generation Started',
    description: 'Magical ethereal harmonic swell when generation begins',
    defaultPreset: 'world_generation_started',
  },
  {
    type: 'object_spawned',
    label: 'Object Spawned',
    description: 'Crisp, high-energy pop synth for general entities',
    defaultPreset: 'object_spawned',
  },
  {
    type: 'tree_generated',
    label: 'Tree Generated',
    description: 'Organic marimba/woodblock harmonic tone',
    defaultPreset: 'tree_generated',
  },
  {
    type: 'building_generated',
    label: 'Building Generated',
    description: 'Heavy industrial bass resonance with metallic timbre',
    defaultPreset: 'building_generated',
  },
  {
    type: 'enemy_spawned',
    label: 'Enemy Spawned',
    description: 'Dark, dissonant tritone alert chord',
    defaultPreset: 'enemy_spawned',
  },
  {
    type: 'object_destroyed',
    label: 'Object Destroyed',
    description: 'Low-frequency pitch-dropping destruction burst',
    defaultPreset: 'object_destroyed',
  },
  {
    type: 'environment_changed',
    label: 'Environment Changed',
    description: 'Smooth atmospheric choral sweep for sky/fog shifts',
    defaultPreset: 'environment_changed',
  },
  {
    type: 'world_generation_completed',
    label: 'World Ready',
    description: 'Bright ascending major fanfare when 3D scene mounts',
    defaultPreset: 'world_generation_completed',
  },
] as const;

