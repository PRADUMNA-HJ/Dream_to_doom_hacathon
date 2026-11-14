import * as Tone from 'tone';
import type { AudioMood, GameEventType } from '../shared/schemas/worldSchema';
import { useDreamStore } from '../store/useDreamStore';
import {
  initializeAudio as initMasterAudio,
  connectToMasterBus,
  muteMasterAudio,
  unmuteMasterAudio,
  setMasterVolume,
  disposeAudio as disposeMasterAudio,
} from './audio/audioManager';
import {
  startAmbientAudio,
  changeAmbientPreset,
  updateAmbientMood,
  disposeAmbientAudio,
} from './audio/ambientAudio';
import {
  initializeSoundEffects,
  playSoundEffect,
  disposeSoundEffects,
  type GameAudioEventType,
} from './audio/soundEffects';

/**
 * Root note and scale configurations satisfying Part 10 requirements.
 * Root note: C3 (MIDI 48, ~130.81 Hz).
 */
export const ROOT_NOTE = 'C3';
export const ROOT_FREQUENCY_HZ = 130.81;

/**
 * Dream profile: Major Pentatonic
 * Semitones: [0, 2, 4, 7, 9] relative to root
 */
export const MAJOR_PENTATONIC_SEMITONES = [0, 2, 4, 7, 9] as const;

/**
 * Doom profile: Half-Whole Diminished (Octatonic)
 * Semitones: [0, 1, 3, 4, 6, 7, 9, 10] relative to root
 */
export const HALF_WHOLE_DIMINISHED_SEMITONES = [0, 1, 3, 4, 6, 7, 9, 10] as const;

/**
 * Calculates equal-tempered frequency in Hertz from a root frequency and semitone offset.
 * f = f_0 * 2^(semitone / 12)
 */
export function semitoneToFrequency(rootHz: number, semitone: number): number {
  return Number((rootHz * Math.pow(2, semitone / 12)).toFixed(2));
}

export function getScaleFrequencies(rootHz: number, intervals: readonly number[]): number[] {
  return intervals.map((semitone) => semitoneToFrequency(rootHz, semitone));
}

/**
 * Maps WorldSpec audioMood to canonical music profile (Dream vs Doom).
 */
export function getMusicProfileForMood(mood: AudioMood): 'dream' | 'doom' {
  switch (mood) {
    case 'calm':
    case 'mystical':
      return 'dream';
    case 'tense':
    case 'chaotic':
      return 'doom';
  }
}

export class SoundEngine {
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private ambientSynth: Tone.PolySynth | null = null;
  private sfxSynth: Tone.Synth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private filter: Tone.Filter | null = null;
  private currentMood: AudioMood = 'calm';
  private loopIntervalId: ReturnType<typeof setInterval> | null = null;

  public getCurrentMood(): AudioMood {
    return this.currentMood;
  }

  public getActiveProfile(): 'dream' | 'doom' {
    return getMusicProfileForMood(this.currentMood);
  }

  /**
   * Initializes Tone.js AudioContext upon an explicit user gesture.
   */
  public async initAudio(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // 1. Centralized Master Audio Pipeline (Gain -> Compressor -> Limiter -> Destination)
      try {
        await initMasterAudio();
        await initializeSoundEffects();
      } catch (masterErr) {
        console.warn('[SoundEngine] Master bus initialization warning:', masterErr);
      }

      await Tone.start();

      // Master output filter & reverb bus routed through Master Bus
      this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 });
      try {
        connectToMasterBus(this.reverb);
      } catch {
        this.reverb.toDestination();
      }
      await this.reverb.generate();

      this.filter = new Tone.Filter(1800, 'lowpass').connect(this.reverb);

      // Ambient mood synthesizer (Pads)
      this.ambientSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.5, decay: 2.0, sustain: 0.7, release: 2.5 },
      }).connect(this.filter);
      this.ambientSynth.volume.value = -12;

      // SFX synthesizer (Immediate game actions)
      this.sfxSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
      }).connect(this.reverb);
      this.sfxSynth.volume.value = -8;

      // Noise synthesizer (Impacts, damage)
      this.noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0 },
      }).connect(this.filter);
      this.noiseSynth.volume.value = -14;

      this.isInitialized = true;
      useDreamStore.getState().setAudioInitialized(true);
      useDreamStore.getState().addTelemetryLog('audio-ready', 'Tone.js audio engine initialized.');

      // Start gentle ambient mood loop & preset
      this.applyAudioMood(this.currentMood);

      return true;
    } catch (err) {
      console.warn('[SoundEngine] Audio context initialization failed:', err);
      return false;
    }
  }

  /**
   * Updates ambient musical scales based on Scene Graph audioMood.
   */
  public applyAudioMood(mood: AudioMood): void {
    this.currentMood = mood;
    if (!this.isInitialized || this.isMuted) return;

    // Synchronize Person 3's procedural ambient preset & mood scale
    try {
      switch (mood) {
        case 'calm':
          updateAmbientMood({ scale: 'pentatonic', tempo: 100, ambientPreset: 'nature_breeze', reverbDecay: 3.0 });
          startAmbientAudio('nature_breeze');
          changeAmbientPreset('nature_breeze');
          break;
        case 'mystical':
          updateAmbientMood({ scale: 'pentatonic', tempo: 110, ambientPreset: 'ethereal_drone', reverbDecay: 3.5 });
          startAmbientAudio('ethereal_drone');
          changeAmbientPreset('ethereal_drone');
          break;
        case 'tense':
          updateAmbientMood({ scale: 'minor', tempo: 130, ambientPreset: 'dystopian_drone', reverbDecay: 2.0 });
          startAmbientAudio('dystopian_drone');
          changeAmbientPreset('dystopian_drone');
          break;
        case 'chaotic':
          updateAmbientMood({ scale: 'diminished', tempo: 140, ambientPreset: 'cyber_ambience', reverbDecay: 1.5 });
          startAmbientAudio('cyber_ambience');
          changeAmbientPreset('cyber_ambience');
          break;
      }
    } catch {
      // Graceful fallback in mocked test environments
    }

    if (!this.ambientSynth) return;

    if (this.loopIntervalId) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }

    let chords: string[][];
    let intervalMs = 6000;

    switch (mood) {
      case 'calm':
        chords = [['C3', 'G3', 'E4'], ['F3', 'C4', 'A4'], ['A2', 'E3', 'C4']];
        if (this.filter) this.filter.frequency.rampTo(1200, 2);
        intervalMs = 7000;
        break;
      case 'mystical':
        chords = [['D3', 'A3', 'F4', 'C5'], ['G3', 'D4', 'Bb4'], ['Bb2', 'F3', 'D4']];
        if (this.filter) this.filter.frequency.rampTo(2400, 2);
        intervalMs = 6000;
        break;
      case 'tense':
        chords = [['F#2', 'C#3', 'G3'], ['D2', 'A2', 'D#3'], ['C2', 'G2', 'Db3']];
        if (this.filter) this.filter.frequency.rampTo(900, 1.5);
        intervalMs = 4500;
        break;
      case 'chaotic':
        chords = [['E3', 'Bb3', 'Eb4'], ['C3', 'F#3', 'B3'], ['G#2', 'D3', 'G3']];
        if (this.filter) this.filter.frequency.rampTo(3200, 1);
        intervalMs = 3000;
        break;
    }

    let chordIdx = 0;
    const playNextChord = () => {
      if (!this.isInitialized || this.isMuted || !this.ambientSynth) return;
      try {
        const chord = chords[chordIdx % chords.length];
        this.ambientSynth.triggerAttackRelease(chord, '2n', undefined, 0.4);
        chordIdx++;
      } catch (err) {
        console.warn('[SoundEngine] Ambient playback exception:', err);
      }
    };

    playNextChord();
    this.loopIntervalId = setInterval(playNextChord, intervalMs);
  }

  /**
   * Plays discrete one-shot SFX mapped to typed GameEvents.
   */
  public playEventSfx(type: GameEventType): void {
    if (!this.isInitialized || this.isMuted) return;

    // Trigger Person 3's procedural sound effects engine
    const canonicalMap: Record<GameEventType, GameAudioEventType> = {
      'world-generated': 'world_generation_completed',
      'item-collected': 'object_spawned',
      'player-jump': 'object_spawned',
      'player-damaged': 'object_destroyed',
      'portal-entered': 'environment_changed',
      'game-over': 'object_destroyed',
    };
    const canonical = canonicalMap[type];
    if (canonical) {
      try {
        playSoundEffect(canonical);
      } catch {
        // Fallback for mocked environments
      }
    }

    const now = Tone.now();

    try {
      switch (type) {
        case 'world-generated':
          if (this.sfxSynth) {
            this.sfxSynth.triggerAttackRelease('C4', '16n', now);
            this.sfxSynth.triggerAttackRelease('E4', '16n', now + 0.1);
            this.sfxSynth.triggerAttackRelease('G4', '16n', now + 0.2);
            this.sfxSynth.triggerAttackRelease('C5', '8n', now + 0.3);
          }
          break;

        case 'player-jump':
          if (this.sfxSynth) {
            this.sfxSynth.triggerAttackRelease('G3', '16n', now);
            this.sfxSynth.frequency.exponentialRampTo('D4', 0.15, now);
          }
          break;

        case 'item-collected':
          if (this.sfxSynth) {
            this.sfxSynth.triggerAttackRelease('E5', '32n', now);
            this.sfxSynth.triggerAttackRelease('B5', '16n', now + 0.08);
          }
          break;

        case 'player-damaged':
          if (this.noiseSynth) {
            this.noiseSynth.triggerAttackRelease('16n', now);
          }
          break;

        case 'portal-entered':
          if (this.sfxSynth) {
            this.sfxSynth.triggerAttackRelease('A3', '8n', now);
            this.sfxSynth.frequency.exponentialRampTo('E5', 0.5, now);
          }
          break;

        case 'game-over':
          if (this.sfxSynth) {
            this.sfxSynth.triggerAttackRelease('C4', '16n', now);
            this.sfxSynth.triggerAttackRelease('Ab3', '16n', now + 0.2);
            this.sfxSynth.triggerAttackRelease('F3', '4n', now + 0.4);
          }
          break;
      }
    } catch (err) {
      console.warn('[SoundEngine] SFX trigger error:', err);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    useDreamStore.getState().setMuted(muted);
    try {
      if (muted) {
        muteMasterAudio();
      } else {
        unmuteMasterAudio();
      }
    } catch {
      // Fallback
    }
    try {
      Tone.getDestination().mute = muted;
    } catch {
      // Fallback
    }
  }

  public setVolume(volume: number): void {
    useDreamStore.getState().setAudioVolume(volume);
    try {
      setMasterVolume(volume);
    } catch {
      // Fallback
    }
    try {
      const db = volume <= 0 ? -Infinity : Tone.gainToDb(volume);
      Tone.getDestination().volume.rampTo(db, 0.1);
    } catch {
      // Fallback
    }
  }

  public dispose(): void {
    if (this.loopIntervalId) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    this.ambientSynth?.dispose();
    this.sfxSynth?.dispose();
    this.noiseSynth?.dispose();
    this.reverb?.dispose();
    this.filter?.dispose();
    this.isInitialized = false;

    try {
      disposeAmbientAudio();
      disposeSoundEffects();
      disposeMasterAudio();
    } catch {
      // Clean up
    }
  }
}

export const soundEngine = new SoundEngine();
