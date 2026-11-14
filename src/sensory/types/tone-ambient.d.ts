/**
 * Dream-to-Doom: Sensory Domain — Tone.js Ambient Declarations
 * Provides ambient type safety for Tone.js Web Audio components prior to
 * the root dependency installation (`npm install tone`).
 */

declare module 'tone' {
  export function start(): Promise<void>;
  export function now(): number;
  export function gainToDb(gain: number): number;
  export function dbToGain(db: number): number;
  export function getDestination(): ToneAudioNode;

  export const context: {
    state: 'suspended' | 'running' | 'closed';
    resume: () => Promise<void>;
    [key: string]: unknown;
  };

  export class ToneAudioNode {
    connect(destination: unknown, outputNum?: number, inputNum?: number): this;
    disconnect(destination?: unknown, outputNum?: number, inputNum?: number): this;
    toDestination(): this;
    dispose(): this;
  }

  export class Param<Type = number> {
    value: Type;
    rampTo(value: Type, rampTime?: number, startTime?: number): this;
    setValueAtTime(value: Type, time: number): this;
  }

  export class Gain extends ToneAudioNode {
    constructor(gain?: number | { gain?: number });
    gain: Param<number>;
  }

  export class Compressor extends ToneAudioNode {
    constructor(options?: {
      threshold?: number;
      ratio?: number;
      attack?: number;
      release?: number;
      knee?: number;
    });
    threshold: Param<number>;
    ratio: Param<number>;
  }

  export class Limiter extends ToneAudioNode {
    constructor(threshold?: number | { threshold?: number });
    threshold: Param<number>;
  }

  export class Filter extends ToneAudioNode {
    constructor(
      frequency?: number | { frequency?: number; type?: string; Q?: number; rolloff?: number },
      type?: string,
      rolloff?: number
    );
    frequency: Param<number>;
    Q: Param<number>;
    type: string;
  }

  export class LFO extends ToneAudioNode {
    constructor(
      frequency?: number | { frequency?: number; min?: number; max?: number; type?: string },
      min?: number,
      max?: number
    );
    frequency: Param<number>;
    min: number;
    max: number;
    start(): this;
    stop(): this;
  }

  export class Noise extends ToneAudioNode {
    constructor(
      type?:
        | 'white'
        | 'pink'
        | 'brown'
        | { type?: 'white' | 'pink' | 'brown'; volume?: number }
    );
    type: 'white' | 'pink' | 'brown';
    start(): this;
    stop(): this;
    volume: Param<number>;
  }

  export class PolySynth extends ToneAudioNode {
    constructor(options?: unknown);
    triggerAttackRelease(
      notes: string | string[],
      duration: string | number,
      time?: number,
      velocity?: number
    ): this;
    triggerAttack(notes: string | string[], time?: number, velocity?: number): this;
    triggerRelease(notes: string | string[], time?: number): this;
    releaseAll(): this;
    volume: Param<number>;
  }

  export class Synth extends ToneAudioNode {
    constructor(options?: unknown);
    triggerAttackRelease(note: string, duration: string | number, time?: number, velocity?: number): this;
    triggerAttack(note: string, time?: number, velocity?: number): this;
    triggerRelease(time?: number): this;
    volume: Param<number>;
  }

  export class FatOscillator extends ToneAudioNode {
    constructor(
      frequency?:
        | number
        | string
        | { frequency?: number | string; type?: string; spread?: number; count?: number; volume?: number }
    );
    frequency: Param<number>;
    spread: number;
    count: number;
    start(): this;
    stop(): this;
    volume: Param<number>;
  }

  export class Volume extends ToneAudioNode {
    constructor(volume?: number | { volume?: number });
    volume: Param<number>;
  }

  export class Panner extends ToneAudioNode {
    constructor(pan?: number | { pan?: number });
    pan: Param<number>;
  }
}

