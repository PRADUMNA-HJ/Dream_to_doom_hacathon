import * as Tone from 'tone';
import type { AudioMood, GameEventType } from '../shared/schemas/worldSchema';
import { useDreamStore } from '../store/useDreamStore';

export class SoundEngine {
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private ambientSynth: Tone.PolySynth | null = null;
  private sfxSynth: Tone.Synth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private filter: Tone.Filter | null = null;
  private currentMood: AudioMood = 'calm';
  private loopIntervalId: number | null = null;

  /**
   * Initializes Tone.js AudioContext upon an explicit user gesture.
   */
  public async initAudio(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await Tone.start();

      // Master output filter & reverb bus
      this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 }).toDestination();
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

      // Start gentle ambient mood loop
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
    if (!this.isInitialized || this.isMuted || !this.ambientSynth) return;

    if (this.loopIntervalId) {
      window.clearInterval(this.loopIntervalId);
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
    this.loopIntervalId = window.setInterval(playNextChord, intervalMs);
  }

  /**
   * Plays discrete one-shot SFX mapped to typed GameEvents.
   */
  public playEventSfx(type: GameEventType): void {
    if (!this.isInitialized || this.isMuted) return;

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
    Tone.getDestination().mute = muted;
  }

  public setVolume(volume: number): void {
    // Convert 0..1 to dB (-40dB to 0dB)
    const db = volume <= 0 ? -Infinity : Tone.gainToDb(volume);
    Tone.getDestination().volume.rampTo(db, 0.1);
    useDreamStore.getState().setAudioVolume(volume);
  }

  public dispose(): void {
    if (this.loopIntervalId) {
      window.clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    this.ambientSynth?.dispose();
    this.sfxSynth?.dispose();
    this.noiseSynth?.dispose();
    this.reverb?.dispose();
    this.filter?.dispose();
    this.isInitialized = false;
  }
}

export const soundEngine = new SoundEngine();
