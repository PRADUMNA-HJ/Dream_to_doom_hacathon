/// <reference path="../types/tone-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Ambient Audio Synthesizer
 * Generates procedural atmospheric soundscapes dynamically shaped by AudioMoodConfig.
 *
 * MANDATORY ARCHITECTURE RULE:
 * All ambient audio nodes route strictly through an ambient sub-bus connected via
 * `connectToMasterBus(ambientSubBus)`. Never connect directly to Tone.getDestination().
 *
 * Pipeline:
 * [Ambient Synth / Noise / Oscillators] -> [Channel Gain] -> [Ambient Sub-bus]
 *                                                                  |
 *                                                     connectToMasterBus()
 *                                                                  |
 *                                                                  v
 *                                           [Master Gain -> Compressor -> Limiter -> Destination]
 */

import * as Tone from 'tone';
import type {
  AmbientPresetConfig,
  AmbientPresetType,
  AudioMoodConfig,
} from '../types/audio.types';
import {
  AMBIENT_PRESETS,
  DEFAULT_AUDIO_MOOD,
  MUSICAL_SCALES,
} from '../utils/audioConfig';
import { connectToMasterBus, initializeAudio, isAudioInitialized } from './audioManager';

// ============================================================================
// Internal State Encapsulation
// ============================================================================

interface ActivePresetNodes {
  channelGain: Tone.Gain;
  polySynth?: Tone.PolySynth;
  synth?: Tone.Synth;
  oscillator?: Tone.FatOscillator;
  noise?: Tone.Noise;
  filter?: Tone.Filter;
  lfo?: Tone.LFO;
  volumeNode?: Tone.Volume;
}

interface AmbientEngineState {
  isPlaying: boolean;
  activePreset: AmbientPresetType | null;
  volume: number; // 0.0 to 1.0 normalized
  currentMood: AudioMoodConfig;
  subBusGain: Tone.Gain | null;
  activeNodes: ActivePresetNodes | null;
  fadeDurationSec: number;
  pendingTimeoutId: ReturnType<typeof setTimeout> | null;
  isSubBusConnected: boolean;
}

const state: AmbientEngineState = {
  isPlaying: false,
  activePreset: null,
  volume: 0.8,
  currentMood: { ...DEFAULT_AUDIO_MOOD },
  subBusGain: null,
  activeNodes: null,
  fadeDurationSec: 0.8,
  pendingTimeoutId: null,
  isSubBusConnected: false,
};

// ============================================================================
// Helper: Sub-Bus Provisioning & Routing
// ============================================================================

/**
 * Ensures the dedicated ambient sub-bus exists and is connected to the Master Audio Pipeline.
 * Guarantees connectToMasterBus is called exactly once per sub-bus lifecycle.
 */
function ensureSubBus(): Tone.Gain {
  if (!state.subBusGain) {
    state.subBusGain = new Tone.Gain(0);
    // Mandatory Architecture Rule: Connect strictly through master bus pipeline
    connectToMasterBus(state.subBusGain);
    state.isSubBusConnected = true;
  }
  return state.subBusGain;
}

/**
 * Clamps volume to safe [0.0, 1.0] interval.
 */
function clampVolume(vol: number): number {
  if (typeof vol !== 'number' || Number.isNaN(vol) || !Number.isFinite(vol)) {
    return state.volume;
  }
  return Math.min(Math.max(vol, 0.0), 1.0);
}

/**
 * Cancels any active transition timer to prevent scheduled callback leaks.
 */
function cancelPendingTimeout(): void {
  if (state.pendingTimeoutId !== null) {
    clearTimeout(state.pendingTimeoutId);
    state.pendingTimeoutId = null;
  }
}

/**
 * Safely stops, disconnects, and disposes a group of active Tone.js nodes.
 */
function cleanupNodes(nodes: ActivePresetNodes | null): void {
  if (!nodes) return;

  try {
    if (nodes.lfo) {
      nodes.lfo.stop();
      nodes.lfo.disconnect();
      nodes.lfo.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.noise) {
      nodes.noise.stop();
      nodes.noise.disconnect();
      nodes.noise.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.oscillator) {
      nodes.oscillator.stop();
      nodes.oscillator.disconnect();
      nodes.oscillator.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.polySynth) {
      nodes.polySynth.releaseAll();
      nodes.polySynth.disconnect();
      nodes.polySynth.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.synth) {
      nodes.synth.triggerRelease();
      nodes.synth.disconnect();
      nodes.synth.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.filter) {
      nodes.filter.disconnect();
      nodes.filter.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    if (nodes.volumeNode) {
      nodes.volumeNode.disconnect();
      nodes.volumeNode.dispose();
    }
  } catch {
    // ignore cleanup error
  }

  try {
    nodes.channelGain.disconnect();
    nodes.channelGain.dispose();
  } catch {
    // ignore cleanup error
  }
}

// ============================================================================
// Procedural Preset Synthesizer Generators
// ============================================================================

/**
 * Builds procedural audio nodes for the requested preset and connects them to subBus.
 */
function buildPresetNodes(
  presetKey: AmbientPresetType,
  subBus: Tone.Gain,
  mood: AudioMoodConfig
): ActivePresetNodes | null {
  // Preset 6: Void Silence produces zero audio nodes
  if (presetKey === 'void_silence') {
    return null;
  }

  const config: AmbientPresetConfig =
    AMBIENT_PRESETS[presetKey] || AMBIENT_PRESETS.ethereal_drone;

  // Dedicated channel gain for seamless crossfading
  const channelGain = new Tone.Gain(1);
  channelGain.connect(subBus);

  // Derive notes harmonized with current mood scale
  const scaleNotes = MUSICAL_SCALES[mood.scale] || MUSICAL_SCALES.minor;
  const droneNotes = config.droneNotes.length > 0 ? config.droneNotes : scaleNotes.slice(0, 4);

  const nodes: ActivePresetNodes = { channelGain };

  switch (presetKey) {
    // ------------------------------------------------------------------------
    // 1. Ethereal Drone: Soft, spacious, floating cosmic pad
    // ------------------------------------------------------------------------
    case 'ethereal_drone': {
      nodes.filter = new Tone.Filter({
        frequency: config.filterFrequency,
        type: 'lowpass',
        Q: config.filterQ,
      });

      nodes.lfo = new Tone.LFO({
        frequency: config.modulationSpeedHz,
        min: config.filterFrequency - config.lfoDepth,
        max: config.filterFrequency + config.lfoDepth,
      });

      nodes.polySynth = new Tone.PolySynth({
        volume: config.volumeDb,
        maxPolyphony: 6,
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 2.0, decay: 1.5, sustain: 0.9, release: 3.0 },
        },
      });

      nodes.polySynth.connect(nodes.filter);
      nodes.lfo.connect(nodes.filter.frequency);
      nodes.filter.connect(channelGain);

      nodes.lfo.start();
      nodes.polySynth.triggerAttack(droneNotes);
      break;
    }

    // ------------------------------------------------------------------------
    // 2. Dystopian Drone: Dark, dissonant detuned industrial resonance
    // ------------------------------------------------------------------------
    case 'dystopian_drone': {
      nodes.filter = new Tone.Filter({
        frequency: config.filterFrequency,
        type: 'lowpass',
        Q: config.filterQ,
      });

      nodes.lfo = new Tone.LFO({
        frequency: config.modulationSpeedHz,
        min: config.filterFrequency - config.lfoDepth,
        max: config.filterFrequency + config.lfoDepth,
      });

      nodes.oscillator = new Tone.FatOscillator({
        frequency: droneNotes[0] || 'C1',
        type: 'sawtooth',
        spread: 35,
        count: 3,
        volume: config.volumeDb,
      });

      nodes.polySynth = new Tone.PolySynth({
        volume: config.volumeDb - 3,
        options: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 1.5, decay: 2.0, sustain: 0.8, release: 2.5 },
        },
      });

      nodes.oscillator.connect(nodes.filter);
      nodes.polySynth.connect(nodes.filter);
      nodes.lfo.connect(nodes.filter.frequency);
      nodes.filter.connect(channelGain);

      nodes.lfo.start();
      nodes.oscillator.start();
      nodes.polySynth.triggerAttack(droneNotes.slice(1));
      break;
    }

    // ------------------------------------------------------------------------
    // 3. Cyber Ambience: Resonant futuristic neon electronic atmosphere
    // ------------------------------------------------------------------------
    case 'cyber_ambience': {
      nodes.filter = new Tone.Filter({
        frequency: config.filterFrequency,
        type: 'bandpass',
        Q: config.filterQ,
      });

      const tempoModSpeed = Math.max(0.1, (mood.tempo / 120) * config.modulationSpeedHz);
      nodes.lfo = new Tone.LFO({
        frequency: tempoModSpeed,
        min: config.filterFrequency - config.lfoDepth,
        max: config.filterFrequency + config.lfoDepth,
      });

      nodes.polySynth = new Tone.PolySynth({
        volume: config.volumeDb,
        options: {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.8, decay: 1.2, sustain: 0.7, release: 2.0 },
        },
      });

      nodes.polySynth.connect(nodes.filter);
      nodes.lfo.connect(nodes.filter.frequency);
      nodes.filter.connect(channelGain);

      nodes.lfo.start();
      nodes.polySynth.triggerAttack(droneNotes);
      break;
    }

    // ------------------------------------------------------------------------
    // 4. Nature Breeze: Organic airy wind & gentle rustling textures
    // ------------------------------------------------------------------------
    case 'nature_breeze': {
      nodes.filter = new Tone.Filter({
        frequency: config.filterFrequency,
        type: 'lowpass',
        Q: config.filterQ,
      });

      nodes.lfo = new Tone.LFO({
        frequency: config.modulationSpeedHz,
        min: 300,
        max: 1200,
      });

      nodes.noise = new Tone.Noise({
        type: 'pink',
        volume: config.volumeDb - 4,
      });

      nodes.polySynth = new Tone.PolySynth({
        volume: config.volumeDb - 6,
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 2.5, decay: 2.0, sustain: 0.6, release: 3.5 },
        },
      });

      nodes.noise.connect(nodes.filter);
      nodes.polySynth.connect(nodes.filter);
      nodes.lfo.connect(nodes.filter.frequency);
      nodes.filter.connect(channelGain);

      nodes.lfo.start();
      nodes.noise.start();
      nodes.polySynth.triggerAttack(droneNotes);
      break;
    }

    // ------------------------------------------------------------------------
    // 5. Volcanic Rumble: Deep seismic sub-bass and evolving rumble
    // ------------------------------------------------------------------------
    case 'volcanic_rumble': {
      nodes.filter = new Tone.Filter({
        frequency: config.filterFrequency,
        type: 'lowpass',
        Q: config.filterQ,
      });

      nodes.lfo = new Tone.LFO({
        frequency: config.modulationSpeedHz,
        min: 60,
        max: 260,
      });

      nodes.oscillator = new Tone.FatOscillator({
        frequency: droneNotes[0] || 'A0',
        type: 'sawtooth',
        spread: 20,
        count: 2,
        volume: config.volumeDb,
      });

      nodes.noise = new Tone.Noise({
        type: 'brown',
        volume: config.volumeDb - 6,
      });

      nodes.oscillator.connect(nodes.filter);
      nodes.noise.connect(nodes.filter);
      nodes.lfo.connect(nodes.filter.frequency);
      nodes.filter.connect(channelGain);

      nodes.lfo.start();
      nodes.oscillator.start();
      nodes.noise.start();
      break;
    }

    default: {
      return buildPresetNodes('ethereal_drone', subBus, mood);
    }
  }

  return nodes;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Starts ambient background audio for the specified preset and mood.
 * Smoothly fades in the ambient sub-bus.
 *
 * @param preset - Target ambient preset (defaults to mood.ambientPreset or 'ethereal_drone')
 * @returns Promise<void>
 */
export async function startAmbientAudio(
  preset?: AmbientPresetType
): Promise<void> {
  const targetPreset = preset || state.currentMood.ambientPreset || 'ethereal_drone';

  // 1. Guard against redundant start if already playing this exact preset
  if (state.isPlaying && state.activePreset === targetPreset) {
    return;
  }

  // 2. Verify / ensure master audio engine is operational
  if (!isAudioInitialized()) {
    const initialized = await initializeAudio();
    if (!initialized) {
      console.warn(
        '[Tone.js AmbientAudio] Cannot start ambient audio: Master audio engine is not initialized.'
      );
      return;
    }
  }

  // 3. Ensure ambient sub-bus is connected to master pipeline
  const subBus = ensureSubBus();

  // 4. Handle void_silence: immediately clean up all nodes and timers
  if (targetPreset === 'void_silence') {
    cancelPendingTimeout();
    cleanupNodes(state.activeNodes);
    state.activeNodes = null;
    state.activePreset = 'void_silence';
    state.isPlaying = false;
    subBus.gain.rampTo(0, 0.1);
    return;
  }

  // 5. Clean up any previous nodes and pending timers
  cancelPendingTimeout();
  if (state.activeNodes) {
    cleanupNodes(state.activeNodes);
    state.activeNodes = null;
  }

  try {
    // 6. Construct new synth nodes and route through subBus
    state.activeNodes = buildPresetNodes(targetPreset, subBus, state.currentMood);
    state.activePreset = targetPreset;
    state.isPlaying = true;

    // 7. Smooth fade-in
    subBus.gain.rampTo(state.volume, state.fadeDurationSec);
  } catch (error) {
    console.error(`[Tone.js AmbientAudio] Error starting preset "${targetPreset}":`, error);
    state.isPlaying = false;
    state.activePreset = null;
  }
}

/**
 * Stops all ambient background audio with a smooth fade-out.
 * Immediately cancels any pending crossfade timers.
 */
export function stopAmbientAudio(): void {
  if (!state.isPlaying && !state.activeNodes) return;

  cancelPendingTimeout();
  state.isPlaying = false;
  state.activePreset = null;

  if (state.subBusGain) {
    state.subBusGain.gain.rampTo(0, 0.4);
  }

  const nodesToCleanup = state.activeNodes;
  state.activeNodes = null;

  // Release synths and cleanup nodes after fade-out completes
  state.pendingTimeoutId = setTimeout(() => {
    cleanupNodes(nodesToCleanup);
    state.pendingTimeoutId = null;
  }, 450);
}

/**
 * Switches the ambient audio preset with a smooth crossfade.
 * The old preset remains active and fades out while the new preset fades in.
 *
 * @param preset - Target preset name
 * @returns Promise<void>
 */
export async function changeAmbientPreset(
  preset: AmbientPresetType
): Promise<void> {
  if (state.activePreset === preset && state.isPlaying) return;

  // Handle void silence: immediate clean transition to silence
  if (preset === 'void_silence') {
    cancelPendingTimeout();
    stopAmbientAudio();
    state.activePreset = 'void_silence';
    return;
  }

  if (!state.isPlaying) {
    return startAmbientAudio(preset);
  }

  const subBus = ensureSubBus();
  cancelPendingTimeout();

  try {
    // Build new preset on its own channel gain node
    const newNodes = buildPresetNodes(preset, subBus, state.currentMood);
    if (!newNodes) return;

    // Start new preset at zero and ramp up
    newNodes.channelGain.gain.setValueAtTime(0, 0);
    newNodes.channelGain.gain.rampTo(1, 0.6);

    // Old preset ramps down smoothly
    const oldNodes = state.activeNodes;
    if (oldNodes) {
      oldNodes.channelGain.gain.rampTo(0, 0.5);
    }

    state.activeNodes = newNodes;
    state.activePreset = preset;

    // Dispose old nodes after crossfade finishes
    state.pendingTimeoutId = setTimeout(() => {
      cleanupNodes(oldNodes);
      state.pendingTimeoutId = null;
    }, 600);
  } catch (error) {
    console.error(`[Tone.js AmbientAudio] Crossfade to preset "${preset}" failed:`, error);
  }
}

/**
 * Updates the ambient mood configuration (tempo, scale, reverbDecay) from the Scene Graph.
 * Dynamically updates active drone frequencies if playing.
 *
 * @param mood - Updated AudioMoodConfig
 * @returns Promise<void>
 */
export async function updateAmbientMood(mood: AudioMoodConfig): Promise<void> {
  state.currentMood = { ...mood };

  // If preset changed in the mood, crossfade to it
  if (mood.ambientPreset && mood.ambientPreset !== state.activePreset && state.isPlaying) {
    await changeAmbientPreset(mood.ambientPreset);
    return;
  }

  // If actively playing, update harmonic chord frequencies and tempo LFO
  if (state.isPlaying && state.activeNodes && state.activePreset) {
    const scaleNotes = MUSICAL_SCALES[mood.scale] || MUSICAL_SCALES.minor;
    const config =
      AMBIENT_PRESETS[state.activePreset] || AMBIENT_PRESETS.ethereal_drone;
    const droneNotes = config.droneNotes.length > 0 ? config.droneNotes : scaleNotes.slice(0, 4);

    if (state.activeNodes.polySynth) {
      state.activeNodes.polySynth.releaseAll();
      state.activeNodes.polySynth.triggerAttack(droneNotes);
    }

    if (state.activeNodes.lfo) {
      const tempoMod = Math.max(0.05, (mood.tempo / 120) * config.modulationSpeedHz);
      state.activeNodes.lfo.frequency.rampTo(tempoMod, 0.5);
    }
  }
}

/**
 * Adjusts the ambient sub-bus volume independently of master volume.
 *
 * @param volume - Target volume between 0.0 and 1.0
 */
export function setAmbientVolume(volume: number): void {
  const clamped = clampVolume(volume);
  state.volume = clamped;

  if (state.isPlaying && state.subBusGain) {
    state.subBusGain.gain.rampTo(clamped, 0.2);
  }
}

/**
 * Queries current operational status of the ambient engine.
 */
export function getAmbientStatus(): {
  isPlaying: boolean;
  activePreset: AmbientPresetType | null;
  volume: number;
  mood: AudioMoodConfig;
} {
  return {
    isPlaying: state.isPlaying,
    activePreset: state.activePreset,
    volume: state.volume,
    mood: { ...state.currentMood },
  };
}

/**
 * Safely stops and disposes all ambient audio resources, timers, and sub-bus.
 * Safe to call repeatedly.
 */
export function disposeAmbientAudio(): void {
  cancelPendingTimeout();
  state.isPlaying = false;
  state.activePreset = null;

  cleanupNodes(state.activeNodes);
  state.activeNodes = null;

  if (state.subBusGain) {
    try {
      state.subBusGain.disconnect();
      state.subBusGain.dispose();
    } catch {
      // ignore disposal error
    }
    state.subBusGain = null;
    state.isSubBusConnected = false;
  }
}
