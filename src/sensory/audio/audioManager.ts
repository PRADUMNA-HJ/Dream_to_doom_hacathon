/**
 * Dream-to-Doom: Sensory Domain — Centralized Tone.js Audio Manager
 * Manages the global Web Audio context lifecycle, Master Bus routing,
 * smooth volume transitions, dynamic compression, limiting, and resource disposal.
 *
 * Master Audio Pipeline:
 * [Sound Sources: Ambient / SFX] -> [Master Gain] -> [Compressor] -> [Limiter] -> [Audio Destination]
 */

import * as Tone from 'tone';
import type {
  AudioEngineStatus,
  AudioManagerStatus,
  MasterAudioBusConfig,
} from '../types/audio.types';
import {
  DEFAULT_AUDIO_MOOD,
  DEFAULT_MASTER_AUDIO_CONFIG,
} from '../utils/audioConfig';

// ============================================================================
// Internal State Encapsulation (Singleton Lifecycle)
// ============================================================================

interface AudioManagerState {
  status: AudioEngineStatus;
  currentVolume: number;
  previousVolumeBeforeMute: number;
  isMuted: boolean;
  masterGain: Tone.Gain | null;
  compressor: Tone.Compressor | null;
  limiter: Tone.Limiter | null;
  isInitializing: boolean;
  busConfig: MasterAudioBusConfig;
}

const state: AudioManagerState = {
  status: 'uninitialized',
  currentVolume: DEFAULT_MASTER_AUDIO_CONFIG.defaultVolume,
  previousVolumeBeforeMute: DEFAULT_MASTER_AUDIO_CONFIG.defaultVolume,
  isMuted: false,
  masterGain: null,
  compressor: null,
  limiter: null,
  isInitializing: false,
  busConfig: { ...DEFAULT_MASTER_AUDIO_CONFIG },
};

// ============================================================================
// Helper: Sanitize and Clamp Volume Input
// ============================================================================

const clampVolume = (volume: number): number => {
  if (typeof volume !== 'number' || Number.isNaN(volume) || !Number.isFinite(volume)) {
    return state.currentVolume;
  }
  return Math.min(
    Math.max(volume, state.busConfig.minVolume),
    state.busConfig.maxVolume
  );
};

// ============================================================================
// 1. Audio Initialization
// ============================================================================

/**
 * Initializes the Web Audio context and constructs the master audio pipeline.
 * MUST be invoked following a user gesture (click, tap, or keypress) to satisfy
 * browser autoplay security policies.
 *
 * Pipeline: [Master Gain] -> [Dynamic Compressor] -> [Brickwall Limiter] -> [Destination]
 *
 * @returns Promise<boolean> - True if initialization succeeded and context is running
 */
export async function initializeAudio(): Promise<boolean> {
  // 1. Already initialized check
  if (
    state.status === 'running' &&
    state.masterGain !== null &&
    Tone.context.state === 'running'
  ) {
    return true;
  }

  // 2. Prevent concurrent initialization race conditions
  if (state.isInitializing) {
    return false;
  }

  state.isInitializing = true;
  state.status = 'initializing';

  try {
    // 3. Request Web Audio context authorization via Tone.start()
    await Tone.start();

    // Verify context state
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }

    // 4. Construct Master Processing Nodes if not already built
    if (!state.masterGain || !state.compressor || !state.limiter) {
      // Clean up any dangling nodes first
      disposeMasterBus();

      // Master Gain: initial gain based on volume and mute state
      const initialGain = state.isMuted ? 0 : state.currentVolume;
      state.masterGain = new Tone.Gain(initialGain);

      // Dynamic Compressor: prevents distortion when multiple SFX overlap
      state.compressor = new Tone.Compressor({
        threshold: state.busConfig.compressorThresholdDb,
        ratio: state.busConfig.compressorRatio,
      });

      // Brickwall Limiter: safety ceiling to protect headphones/speakers
      state.limiter = new Tone.Limiter(state.busConfig.limiterThresholdDb);

      // Connect Master Pipeline: Gain -> Compressor -> Limiter -> Audio Destination
      state.masterGain.connect(state.compressor);
      state.compressor.connect(state.limiter);
      state.limiter.toDestination();
    }

    state.status = state.isMuted ? 'muted' : 'running';
    state.isInitializing = false;
    return true;
  } catch (error) {
    state.status = Tone.context.state === 'suspended' ? 'suspended' : 'uninitialized';
    state.isInitializing = false;

    // Autoplay or browser security restriction
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[Tone.js AudioManager] Audio initialization failed (autoplay restriction or unsupported environment): ${message}`
    );
    return false;
  }
}

// ============================================================================
// 2. Master Volume Management
// ============================================================================

/**
 * Adjusts the master audio volume with a smooth linear ramp to prevent audio popping.
 * Value must be between 0.0 (silent) and 1.0 (maximum).
 *
 * @param volume - Target normalized volume level (0.0 to 1.0)
 */
export function setVolume(volume: number): void {
  const sanitizedVolume = clampVolume(volume);
  state.currentVolume = sanitizedVolume;

  if (state.isMuted) {
    // Keep gain at 0 while muted, update target for when unmuted
    state.previousVolumeBeforeMute = sanitizedVolume;
    return;
  }

  if (state.masterGain) {
    state.masterGain.gain.rampTo(
      sanitizedVolume,
      state.busConfig.fadeRampTimeSec
    );
  }
}

/**
 * Retrieves the current master volume level.
 * @returns number - Normalized volume level (0.0 to 1.0)
 */
export function getVolume(): number {
  return state.currentVolume;
}

/**
 * Mutes master audio output while caching the previous volume level.
 */
export function muteAudio(): void {
  if (state.isMuted) return;

  // Preserve volume before mute (ensure fallback if previous was 0)
  state.previousVolumeBeforeMute =
    state.currentVolume > 0
      ? state.currentVolume
      : state.busConfig.defaultVolume;

  state.isMuted = true;

  if (state.masterGain) {
    // Fast 50ms ramp to 0 to prevent audible popping
    state.masterGain.gain.rampTo(0, 0.05);
  }

  if (state.status === 'running') {
    state.status = 'muted';
  }
}

/**
 * Unmutes master audio output, restoring the previous volume level.
 */
export function unmuteAudio(): void {
  if (!state.isMuted) return;

  const restoredVolume = clampVolume(state.previousVolumeBeforeMute);
  state.isMuted = false;
  state.currentVolume = restoredVolume;

  if (state.masterGain) {
    state.masterGain.gain.rampTo(
      restoredVolume,
      state.busConfig.fadeRampTimeSec
    );
  }

  if (state.status === 'muted') {
    state.status = 'running';
  }
}

// ============================================================================
// 3. Status & Querying
// ============================================================================

/**
 * Checks whether the audio engine is fully initialized and operational.
 * @returns boolean - True if master gain exists and context is running
 */
export function isAudioInitialized(): boolean {
  return (
    state.status !== 'uninitialized' &&
    state.status !== 'disposed' &&
    state.masterGain !== null &&
    typeof Tone !== 'undefined' &&
    Tone.context.state === 'running'
  );
}

/**
 * Returns comprehensive telemetry of the master audio manager.
 * @returns AudioManagerStatus - Current operational status
 */
export function getAudioStatus(): AudioManagerStatus {
  return {
    engineStatus: state.status,
    isMuted: state.isMuted,
    volume: state.currentVolume,
    activeAmbientPreset: null, // Populated by Phase 5 ambient module
    isAmbientPlaying: false,   // Populated by Phase 5 ambient module
    currentMood: { ...DEFAULT_AUDIO_MOOD },
  };
}

// ============================================================================
// 4. Centralized Pipeline Connection for Downstream Modules (Phase 5 & 6)
// ============================================================================

/**
 * Connects any Tone.js audio source or sub-bus directly to the centralized Master Gain.
 * This guarantees that all downstream audio sources (ambient and sound effects) pass
 * through the master gain, compressor, and safety limiter.
 *
 * @param node - Any Tone.js audio node (Synth, PolySynth, NoiseSynth, Player, etc.)
 */
export function connectToMasterBus(node: Tone.ToneAudioNode): void {
  if (!state.masterGain) {
    throw new Error(
      '[Tone.js AudioManager] Master bus has not been initialized. Call initializeAudio() first.'
    );
  }
  node.connect(state.masterGain);
}

/**
 * Returns the Master Gain node to allow direct routing or inspection.
 * @returns Tone.Gain | null
 */
export function getMasterBusInput(): Tone.Gain | null {
  return state.masterGain;
}

// ============================================================================
// 5. Resource Cleanup & Disposal
// ============================================================================

/**
 * Helper to safely disconnect and dispose master bus nodes.
 */
function disposeMasterBus(): void {
  if (state.masterGain) {
    try {
      state.masterGain.disconnect();
      state.masterGain.dispose();
    } catch {
      // ignore node cleanup errors
    }
    state.masterGain = null;
  }

  if (state.compressor) {
    try {
      state.compressor.disconnect();
      state.compressor.dispose();
    } catch {
      // ignore node cleanup errors
    }
    state.compressor = null;
  }

  if (state.limiter) {
    try {
      state.limiter.disconnect();
      state.limiter.dispose();
    } catch {
      // ignore node cleanup errors
    }
    state.limiter = null;
  }
}

/**
 * Disposes all audio nodes in the master pipeline and resets internal state.
 * Safe to invoke multiple times without throwing errors.
 * Preserves the shared Tone.js AudioContext to prevent breaking parallel contexts.
 */
export function disposeAudio(): void {
  disposeMasterBus();

  state.status = 'disposed';
  state.isInitializing = false;
  state.isMuted = false;
  state.currentVolume = state.busConfig.defaultVolume;
  state.previousVolumeBeforeMute = state.busConfig.defaultVolume;
}

// ============================================================================
// Canonical Named Aliases (Guarantees Single Shared Singleton Pipeline)
// ============================================================================

export const setMasterVolume = setVolume;
export const getMasterVolume = getVolume;
export const muteMasterAudio = muteAudio;
export const unmuteMasterAudio = unmuteAudio;
export const getMasterAudioStatus = getAudioStatus;

