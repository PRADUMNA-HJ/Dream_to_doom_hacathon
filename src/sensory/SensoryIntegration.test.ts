import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('tone', () => {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    now: vi.fn().mockReturnValue(0),
    gainToDb: vi.fn((gain: number) => (gain <= 0 ? -Infinity : 20 * Math.log10(gain))),
    dbToGain: vi.fn((db: number) => Math.pow(10, db / 20)),
    getDestination: vi.fn(() => ({
      mute: false,
      volume: { rampTo: vi.fn() },
    })),
    context: {
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    },
    Gain: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      gain: {
        rampTo: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 1,
      },
      dispose: vi.fn(),
    })),
    Compressor: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    Limiter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      toDestination: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    })),
    PolySynth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      triggerAttack: vi.fn(),
      releaseAll: vi.fn(),
      dispose: vi.fn(),
    })),
    Synth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      frequency: { exponentialRampTo: vi.fn() },
      dispose: vi.fn(),
    })),
    NoiseSynth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn(),
    })),
    Noise: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      volume: { value: 0 },
    })),
    LFO: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      frequency: { rampTo: vi.fn(), value: 0 },
    })),
    FatOscillator: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      volume: { value: 0 },
    })),
    Volume: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
      volume: { value: 0 },
    })),
    Reverb: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
      connect: vi.fn().mockReturnThis(),
      generate: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    })),
    Filter: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      frequency: { rampTo: vi.fn() },
      dispose: vi.fn(),
    })),
  };
});

import { soundEngine } from './SoundEngine';
import { useDreamStore } from '../store/useDreamStore';
import { resolveCanonicalAudioEvent } from './hooks/useGameAudioEvents';
import { isAudioInitialized, getAudioStatus } from './audio/audioManager';
import { getAmbientStatus } from './audio/ambientAudio';
import { getSoundEffectsStatus } from './audio/soundEffects';

describe('Person 3 Sensory & Audio Master Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDreamStore.getState().resetSession();
  });

  it('initializes canonical Tone.js master audio pipeline on explicit user action', async () => {
    const success = await soundEngine.initAudio();
    expect(success).toBe(true);

    const storeState = useDreamStore.getState();
    expect(storeState.isAudioInitialized).toBe(true);

    const audioStatus = getAudioStatus();
    expect(audioStatus.engineStatus).toBe('running');
    expect(isAudioInitialized()).toBe(true);
  });

  it('correctly maps Enchanted Forest (calm) to Major Pentatonic scale and natural ambience', async () => {
    await soundEngine.initAudio();
    soundEngine.applyAudioMood('calm');

    expect(soundEngine.getCurrentMood()).toBe('calm');
    expect(soundEngine.getActiveProfile()).toBe('dream');

    const ambientStatus = getAmbientStatus();
    expect(ambientStatus.activePreset).toBe('nature_breeze');
    expect(ambientStatus.mood.scale).toBe('pentatonic');
  });

  it('correctly maps Cyberpunk Citadel (chaotic) to Diminished scale and cyber ambience', async () => {
    await soundEngine.initAudio();
    soundEngine.applyAudioMood('chaotic');

    expect(soundEngine.getCurrentMood()).toBe('chaotic');
    expect(soundEngine.getActiveProfile()).toBe('doom');

    const ambientStatus = getAmbientStatus();
    expect(ambientStatus.activePreset).toBe('cyber_ambience');
    expect(ambientStatus.mood.scale).toBe('diminished');
  });

  it('synchronizes master volume and mute state across SoundEngine, audioManager, and Zustand', async () => {
    await soundEngine.initAudio();

    // Volume change
    soundEngine.setVolume(0.42);
    expect(useDreamStore.getState().audioVolume).toBe(0.42);
    expect(getAudioStatus().volume).toBeCloseTo(0.42, 2);

    // Mute toggle
    soundEngine.setMuted(true);
    expect(useDreamStore.getState().isMuted).toBe(true);
    expect(getAudioStatus().isMuted).toBe(true);

    // Unmute toggle
    soundEngine.setMuted(false);
    expect(useDreamStore.getState().isMuted).toBe(false);
    expect(getAudioStatus().isMuted).toBe(false);
  });

  it('maps both GameEvent objects and raw strings to canonical audio events in useGameAudioEvents', () => {
    // String mapping
    expect(resolveCanonicalAudioEvent('world_generation_started')).toBe('world_generation_started');
    expect(resolveCanonicalAudioEvent('spawn:tree:42')).toBe('tree_generated');
    expect(resolveCanonicalAudioEvent('destroy:object:99')).toBe('object_destroyed');

    // Person 1 & 2 GameEventType objects
    expect(resolveCanonicalAudioEvent({ type: 'world-generated' })).toBe('world_generation_completed');
    expect(resolveCanonicalAudioEvent({ type: 'item-collected' })).toBe('object_spawned');
    expect(resolveCanonicalAudioEvent({ type: 'player-damaged' })).toBe('object_destroyed');
    expect(resolveCanonicalAudioEvent({ type: 'portal-entered' })).toBe('environment_changed');
    expect(resolveCanonicalAudioEvent({ type: 'game-over' })).toBe('object_destroyed');
  });

  it('routes event SFX to procedural sound effects engine without throwing', async () => {
    await soundEngine.initAudio();

    expect(() => soundEngine.playEventSfx('world-generated')).not.toThrow();
    expect(() => soundEngine.playEventSfx('item-collected')).not.toThrow();
    expect(() => soundEngine.playEventSfx('player-damaged')).not.toThrow();

    const sfxStatus = getSoundEffectsStatus();
    expect(sfxStatus.isInitialized).toBe(true);
  });

  it('cleans up and disposes all nodes without leaks on soundEngine.dispose()', async () => {
    await soundEngine.initAudio();
    soundEngine.dispose();

    expect(getAmbientStatus().isPlaying).toBe(false);
    expect(getSoundEffectsStatus().isInitialized).toBe(false);
  });
});
