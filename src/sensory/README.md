# Person 3 — Sensory & Audio Domain (`src/sensory/`)

This directory is exclusively owned by **Person 3 (Sensory & Input Lead)**.

## Responsibilities
* Microphone permission requests and user media streams.
* Web Speech API continuous speech-to-text recognition and text input fallback.
* Dispatching transcripts to Zustand (`setTranscript`, `setListening`, `setSpeechError`).
* Tone.js audio engine, synthesizer mood scales, soundscapes, and procedural sound effects.
* Subscribing to `world.audioMood` and the non-destructive `activeEvents` stream from Zustand.

## Contract & Imports
* Import the shared store and types:
  ```typescript
  import { useDreamStore } from '../store/useDreamStore';
  import type { AudioMood, GameEvent } from '../shared/schemas/worldSchema';
  ```
* Dispatch transcripts to Zustand:
  ```typescript
  const setTranscript = useDreamStore((state) => state.setTranscript);
  const setListening = useDreamStore((state) => state.setListening);
  ```
* Do **NOT** modify files in `src/shared/`, `src/store/`, or `src/services/` directly. Coordinate schema changes through Person 1.
