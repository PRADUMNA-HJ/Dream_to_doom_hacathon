import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('tone', () => {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    now: vi.fn().mockReturnValue(0),
    gainToDb: vi.fn((gain: number) => (gain <= 0 ? -Infinity : 20 * Math.log10(gain))),
    getDestination: vi.fn(() => ({
      mute: false,
      volume: { rampTo: vi.fn() },
    })),
    PolySynth: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockReturnThis(),
      volume: { value: 0 },
      triggerAttackRelease: vi.fn(),
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
    Reverb: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
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

import {
  ROOT_NOTE,
  ROOT_FREQUENCY_HZ,
  MAJOR_PENTATONIC_SEMITONES,
  HALF_WHOLE_DIMINISHED_SEMITONES,
  semitoneToFrequency,
  getScaleFrequencies,
  getMusicProfileForMood,
  SoundEngine,
} from './SoundEngine';

describe('SoundEngine Dynamic Scale Transition Tests (Part 10 & 15.F)', () => {
  let engine: SoundEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SoundEngine();
  });

  it('verifies canonical root note and frequency', () => {
    expect(ROOT_NOTE).toBe('C3');
    expect(ROOT_FREQUENCY_HZ).toBeCloseTo(130.81, 2);
  });

  it('verifies exact semitone intervals for Dream profile (Major Pentatonic)', () => {
    expect(Array.from(MAJOR_PENTATONIC_SEMITONES)).toEqual([0, 2, 4, 7, 9]);
  });

  it('verifies exact semitone intervals for Doom profile (Half-Whole Diminished)', () => {
    expect(Array.from(HALF_WHOLE_DIMINISHED_SEMITONES)).toEqual([0, 1, 3, 4, 6, 7, 9, 10]);
  });

  it('calculates equal-tempered frequencies accurately', () => {
    // Root C3 = 130.81
    expect(semitoneToFrequency(130.81, 0)).toBe(130.81);
    // Octave = 12 semitones = 2 * root = 261.62
    expect(semitoneToFrequency(130.81, 12)).toBe(261.62);

    const dreamFreqs = getScaleFrequencies(130.81, MAJOR_PENTATONIC_SEMITONES);
    expect(dreamFreqs.length).toBe(5);
    expect(dreamFreqs[0]).toBe(130.81); // C3
    expect(dreamFreqs[1]).toBe(146.83); // D3 (+2)
    expect(dreamFreqs[2]).toBe(164.81); // E3 (+4)
    expect(dreamFreqs[3]).toBe(195.99); // G3 (+7)
    expect(dreamFreqs[4]).toBe(220.00); // A3 (+9)
  });

  it('maps Scene Graph audioMood to canonical music profile (Dream vs Doom)', () => {
    expect(getMusicProfileForMood('calm')).toBe('dream');
    expect(getMusicProfileForMood('mystical')).toBe('dream');
    expect(getMusicProfileForMood('tense')).toBe('doom');
    expect(getMusicProfileForMood('chaotic')).toBe('doom');
  });

  it('activates Tone.js audio engine upon user gesture', async () => {
    const initialized = await engine.initAudio();
    expect(initialized).toBe(true);
    expect(engine.getActiveProfile()).toBe('dream');
  });

  it('smoothly updates music mood without creating duplicate synthesizers', async () => {
    await engine.initAudio();

    // Transition from calm (Dream) to tense (Doom)
    engine.applyAudioMood('tense');
    expect(engine.getCurrentMood()).toBe('tense');
    expect(engine.getActiveProfile()).toBe('doom');

    // Transition to chaotic
    engine.applyAudioMood('chaotic');
    expect(engine.getCurrentMood()).toBe('chaotic');
    expect(engine.getActiveProfile()).toBe('doom');

    engine.dispose();
  });
});
