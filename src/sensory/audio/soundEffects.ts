/// <reference path="../types/tone-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Procedural Sound Effects & Game Event Mapper
 * Generates synthesized sound effects for real-time 3D world events using Tone.js.
 *
 * MANDATORY ARCHITECTURE RULE:
 * All sound effects route strictly through a dedicated SFX sub-bus connected via
 * `connectToMasterBus(sfxSubBus)`. Never connect sound effects directly to destination.
 *
 * Pipeline:
 * [Procedural SFX Synths (Pooled)] -> [SFX Sub-bus (Gain)]
 *                                             |
 *                                    connectToMasterBus()
 *                                             |
 *                                             v
 *                      [Master Gain -> Compressor -> Limiter -> Destination]
 */

import * as Tone from 'tone';
import type {
  GameAudioEventType,
  GameEventType,
  SoundEffectOptions,
} from '../types/audio.types';
import {
  DEFAULT_MASTER_AUDIO_CONFIG,
  SOUND_EFFECT_PRESETS,
} from '../utils/audioConfig';
import { connectToMasterBus, initializeAudio, isAudioInitialized } from './audioManager';

// Re-export canonical game event types for clean integration
export type { GameAudioEventType, GameEventType };

// ============================================================================
// Event Throttling & Cooldown Configuration (Milliseconds)
// ============================================================================

const EVENT_COOLDOWNS_MS: Record<GameAudioEventType, number> = {
  world_generation_started: 350,
  object_spawned: 60,
  tree_generated: 75,
  building_generated: 100,
  enemy_spawned: 150,
  object_destroyed: 80,
  environment_changed: 250,
  world_generation_completed: 400,
};

// ============================================================================
// Internal State Encapsulation (Singleton)
// ============================================================================

interface PooledSynths {
  polySynth: Tone.PolySynth;
  bassSynth: Tone.PolySynth;
  noise: Tone.Noise;
  noiseFilter: Tone.Filter;
  noiseGain: Tone.Gain;
}

interface SoundEffectsEngineState {
  isInitialized: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  previousVolumeBeforeMute: number;
  sfxSubBus: Tone.Gain | null;
  synths: PooledSynths | null;
  lastEventTimestamps: Map<GameAudioEventType, number>;
  activePlayingCount: number;
  pendingTimeouts: Set<ReturnType<typeof setTimeout>>;
  isSubBusConnected: boolean;
}

const state: SoundEffectsEngineState = {
  isInitialized: false,
  isMuted: false,
  volume: DEFAULT_MASTER_AUDIO_CONFIG.defaultVolume,
  previousVolumeBeforeMute: DEFAULT_MASTER_AUDIO_CONFIG.defaultVolume,
  sfxSubBus: null,
  synths: null,
  lastEventTimestamps: new Map(),
  activePlayingCount: 0,
  pendingTimeouts: new Set(),
  isSubBusConnected: false,
};

// ============================================================================
// Helper: Pitch Transposition Utility
// ============================================================================

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Transposes a note string (e.g. 'C4', 'Eb3') by N semitones without external dependencies.
 */
function transposeNote(noteStr: string, semitones: number): string {
  if (!semitones || semitones === 0) return noteStr;

  // Normalize flat symbols to sharps (e.g. Eb -> D#)
  const normalized = noteStr
    .replace('Bb', 'A#')
    .replace('Eb', 'D#')
    .replace('Ab', 'G#')
    .replace('Db', 'C#')
    .replace('Gb', 'F#');

  const match = normalized.match(/^([A-G]#?)(\d+)$/);
  if (!match) return noteStr;

  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  if (noteIndex === -1) return noteStr;

  const totalSemitones = octave * 12 + noteIndex + semitones;
  const newOctave = Math.floor(totalSemitones / 12);
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12;

  return `${NOTE_NAMES[newNoteIndex]}${newOctave}`;
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

// ============================================================================
// Helper: Sub-Bus Provisioning & Routing
// ============================================================================

/**
 * Ensures the dedicated SFX sub-bus exists and is connected to the Master Audio Pipeline.
 */
function ensureSfxSubBus(): Tone.Gain {
  if (!state.sfxSubBus) {
    const initialGain = state.isMuted ? 0 : state.volume;
    state.sfxSubBus = new Tone.Gain(initialGain);
    // Mandatory Architecture Rule: Connect strictly through master bus pipeline
    connectToMasterBus(state.sfxSubBus);
    state.isSubBusConnected = true;
  }
  return state.sfxSubBus;
}

/**
 * Tracks a timeout ID so it can be safely cancelled upon disposal.
 */
function scheduleTimeout(callback: () => void, delayMs: number): void {
  const timeoutId = setTimeout(() => {
    state.pendingTimeouts.delete(timeoutId);
    callback();
  }, delayMs);
  state.pendingTimeouts.add(timeoutId);
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Initializes the procedural sound effects engine and pools reusable synthesizers.
 * Idempotent: repeated calls safely return without recreating nodes.
 */
export async function initializeSoundEffects(): Promise<void> {
  if (state.isInitialized && state.synths !== null) {
    return;
  }

  // 1. Verify / ensure master audio context is initialized
  if (!isAudioInitialized()) {
    const initialized = await initializeAudio();
    if (!initialized) {
      console.warn(
        '[Tone.js SoundEffects] Master audio engine is not initialized. SFX initialization deferred.'
      );
      return;
    }
  }

  // 2. Ensure SFX sub-bus is connected to master bus
  const sfxBus = ensureSfxSubBus();

  // 3. Construct pooled synthesizers connected strictly to sfxBus
  try {
    // PolySynth: For chords, chimes, and melodic fanfares (16 voice pool)
    const polySynth = new Tone.PolySynth({
      maxPolyphony: 16,
      volume: -6,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.25, sustain: 0.1, release: 0.35 },
      },
    });
    polySynth.connect(sfxBus);

    // BassSynth: Polyphonic bass synth for low punches, construction, and destruction (8 voice pool)
    const bassSynth = new Tone.PolySynth({
      maxPolyphony: 8,
      volume: -4,
      options: {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.35, sustain: 0.0, release: 0.25 },
      },
    });
    bassSynth.connect(sfxBus);

    // Noise Generator & Filter: For explosion transients, wind bursts, and destruction
    const noiseFilter = new Tone.Filter({
      frequency: 1800,
      type: 'lowpass',
      Q: 2.0,
    });
    const noiseGain = new Tone.Gain(0);
    const noise = new Tone.Noise({ type: 'pink' });

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(sfxBus);
    noise.start();

    state.synths = {
      polySynth,
      bassSynth,
      noise,
      noiseFilter,
      noiseGain,
    };

    state.isInitialized = true;
  } catch (error) {
    console.error('[Tone.js SoundEffects] Failed to initialize sound effects pool:', error);
  }
}

/**
 * Plays a procedural sound effect for a designated game event.
 *
 * @param event - The game event type (e.g. 'object_spawned', 'enemy_spawned')
 * @param options - Optional sound parameters (volume, pitchOffsetSemi, note, durationSec)
 */
export function playSoundEffect(
  event: GameAudioEventType,
  options: SoundEffectOptions = {}
): void {
  // 1. Event Throttling: Prevent duplicate rapid playback of the same event
  const now = Date.now();
  const lastTime = state.lastEventTimestamps.get(event) || 0;
  const cooldown = EVENT_COOLDOWNS_MS[event] || 50;

  if (now - lastTime < cooldown) {
    return; // Dropped to prevent voice clipping / sound stacking
  }
  state.lastEventTimestamps.set(event, now);

  // 2. Mute / Volume guard
  if (state.isMuted || state.volume === 0) {
    return;
  }

  // 3. Lazy initialize if not yet loaded
  if (!state.isInitialized || !state.synths) {
    initializeSoundEffects().then(() => {
      if (state.isInitialized) {
        playSoundEffect(event, options);
      }
    });
    return;
  }

  const { polySynth, bassSynth, noiseFilter, noiseGain } = state.synths;
  const preset = SOUND_EFFECT_PRESETS[event];
  if (!preset) return;

  const pitchShift = options.pitchOffsetSemi || 0;
  const baseNotes = options.note
    ? [options.note]
    : preset.baseNotes.map((n) => transposeNote(n, pitchShift));

  state.activePlayingCount++;
  const decrementActiveCount = () => {
    state.activePlayingCount = Math.max(0, state.activePlayingCount - 1);
  };

  try {
    switch (event) {
      // ----------------------------------------------------------------------
      // 1. World Generation Started: Rising futuristic activation arpeggio
      // ----------------------------------------------------------------------
      case 'world_generation_started': {
        const arpeggioNotes = baseNotes;
        arpeggioNotes.forEach((note, idx) => {
          scheduleTimeout(() => {
            polySynth.triggerAttackRelease(note, '16n');
          }, idx * 55);
        });
        scheduleTimeout(decrementActiveCount, arpeggioNotes.length * 55 + 200);
        break;
      }

      // ----------------------------------------------------------------------
      // 2. Object Spawned: Short, crisp confirmation pop
      // ----------------------------------------------------------------------
      case 'object_spawned': {
        const note1 = baseNotes[0] || 'G4';
        const note2 = baseNotes[1] || 'C5';
        polySynth.triggerAttackRelease(note1, '32n');
        scheduleTimeout(() => {
          polySynth.triggerAttackRelease(note2, '32n');
          decrementActiveCount();
        }, 35);
        break;
      }

      // ----------------------------------------------------------------------
      // 3. Tree Generated: Organic resonant wooden chime
      // ----------------------------------------------------------------------
      case 'tree_generated': {
        polySynth.triggerAttackRelease(baseNotes, 0.25);
        scheduleTimeout(decrementActiveCount, 300);
        break;
      }

      // ----------------------------------------------------------------------
      // 4. Building Generated: Heavy industrial construction clank
      // ----------------------------------------------------------------------
      case 'building_generated': {
        bassSynth.triggerAttackRelease(baseNotes[0] || 'C2', 0.2);
        // Short noise burst simulates hammer/mechanical impact
        noiseFilter.frequency.value = 2400;
        noiseGain.gain.setValueAtTime(0.6, 0);
        noiseGain.gain.rampTo(0, 0.08);

        scheduleTimeout(() => {
          polySynth.triggerAttackRelease(baseNotes.slice(1), 0.18);
          decrementActiveCount();
        }, 60);
        break;
      }

      // ----------------------------------------------------------------------
      // 5. Enemy Spawned: Dark, dissonant warning buzz
      // ----------------------------------------------------------------------
      case 'enemy_spawned': {
        bassSynth.triggerAttackRelease(baseNotes[0] || 'Eb2', 0.4);
        polySynth.triggerAttackRelease(baseNotes.slice(1), 0.35);
        scheduleTimeout(decrementActiveCount, 400);
        break;
      }

      // ----------------------------------------------------------------------
      // 6. Object Destroyed: Descending destruction effect
      // ----------------------------------------------------------------------
      case 'object_destroyed': {
        bassSynth.triggerAttackRelease(baseNotes[0] || 'F2', 0.25);

        // Brownish noise explosion burst
        noiseFilter.frequency.value = 800;
        noiseGain.gain.setValueAtTime(0.8, 0);
        noiseGain.gain.rampTo(0, 0.22);

        scheduleTimeout(decrementActiveCount, 250);
        break;
      }

      // ----------------------------------------------------------------------
      // 7. Environment Changed: Smooth atmospheric sweep
      // ----------------------------------------------------------------------
      case 'environment_changed': {
        polySynth.triggerAttackRelease(baseNotes, 0.8);
        scheduleTimeout(decrementActiveCount, 850);
        break;
      }

      // ----------------------------------------------------------------------
      // 8. World Generation Completed: Satisfying triumphant fanfare
      // ----------------------------------------------------------------------
      case 'world_generation_completed': {
        const fanfareNotes = baseNotes;
        fanfareNotes.forEach((note, idx) => {
          scheduleTimeout(() => {
            polySynth.triggerAttackRelease(note, idx === fanfareNotes.length - 1 ? 0.9 : 0.15);
          }, idx * 75);
        });
        scheduleTimeout(decrementActiveCount, fanfareNotes.length * 75 + 1000);
        break;
      }

      default: {
        polySynth.triggerAttackRelease(baseNotes, 0.2);
        decrementActiveCount();
        break;
      }
    }
  } catch (error) {
    console.warn(`[Tone.js SoundEffects] Failed to play event "${event}":`, error);
    decrementActiveCount();
  }
}

/**
 * Adjusts the sound effects sub-bus volume (0.0 to 1.0).
 */
export function setSoundEffectsVolume(volume: number): void {
  const clamped = clampVolume(volume);
  state.volume = clamped;

  if (state.isMuted) {
    state.previousVolumeBeforeMute = clamped;
    return;
  }

  if (state.sfxSubBus) {
    state.sfxSubBus.gain.rampTo(clamped, 0.1);
  }
}

/**
 * Mutes all sound effects output.
 */
export function muteSoundEffects(): void {
  if (state.isMuted) return;

  state.previousVolumeBeforeMute =
    state.volume > 0 ? state.volume : DEFAULT_MASTER_AUDIO_CONFIG.defaultVolume;
  state.isMuted = true;

  // Release any active sustaining notes immediately
  if (state.synths) {
    try {
      state.synths.polySynth.releaseAll();
      state.synths.bassSynth.releaseAll();
    } catch {
      // ignore release error
    }
  }

  if (state.sfxSubBus) {
    state.sfxSubBus.gain.rampTo(0, 0.05);
  }
}

/**
 * Unmutes sound effects output, restoring previous volume.
 */
export function unmuteSoundEffects(): void {
  if (!state.isMuted) return;

  const restored = clampVolume(state.previousVolumeBeforeMute);
  state.isMuted = false;
  state.volume = restored;

  if (state.sfxSubBus) {
    state.sfxSubBus.gain.rampTo(restored, 0.1);
  }
}

/**
 * Returns telemetry and operational status of the sound effects engine.
 */
export function getSoundEffectsStatus(): {
  isInitialized: boolean;
  isMuted: boolean;
  volume: number;
  activePlayingCount: number;
  cooldowns: Record<GameAudioEventType, number>;
} {
  return {
    isInitialized: state.isInitialized,
    isMuted: state.isMuted,
    volume: state.volume,
    activePlayingCount: state.activePlayingCount,
    cooldowns: { ...EVENT_COOLDOWNS_MS },
  };
}

/**
 * Disposes all pooled synthesizers, sub-bus, and cancels all pending timeouts.
 * Safe to call repeatedly.
 */
export function disposeSoundEffects(): void {
  // Cancel all pending scheduled timeouts
  state.pendingTimeouts.forEach((id) => clearTimeout(id));
  state.pendingTimeouts.clear();

  state.isInitialized = false;
  state.activePlayingCount = 0;
  state.lastEventTimestamps.clear();

  if (state.synths) {
    try {
      state.synths.polySynth.releaseAll();
      state.synths.polySynth.disconnect();
      state.synths.polySynth.dispose();
    } catch {
      // ignore disposal error
    }

    try {
      state.synths.bassSynth.releaseAll();
      state.synths.bassSynth.disconnect();
      state.synths.bassSynth.dispose();
    } catch {
      // ignore disposal error
    }

    try {
      state.synths.noise.stop();
      state.synths.noise.disconnect();
      state.synths.noise.dispose();
      state.synths.noiseFilter.disconnect();
      state.synths.noiseFilter.dispose();
      state.synths.noiseGain.disconnect();
      state.synths.noiseGain.dispose();
    } catch {
      // ignore disposal error
    }

    state.synths = null;
  }

  if (state.sfxSubBus) {
    try {
      state.sfxSubBus.disconnect();
      state.sfxSubBus.dispose();
    } catch {
      // ignore disposal error
    }
    state.sfxSubBus = null;
    state.isSubBusConnected = false;
  }
}

