/**
 * Dream-to-Doom: Sensory Domain — Public Entry Point
 * Central barrel file exporting all hooks, components, audio management pipelines,
 * procedural synthesizers, and TypeScript contracts for Person 1 (Lead/State)
 * and Person 2 (3D World/Physics).
 */

// ============================================================================
// 1. Types & Interfaces
// ============================================================================

// Speech & Voice Types
export type {
  SpeechRecognitionStatus,
  SpeechRecognitionErrorType,
  SupportedLanguage,
  SpeechRecognitionHookOptions,
  SpeechRecognitionResult,
  PromptSourceType,
  PromptSubmissionPayload,
} from './types/speech.types';

// Audio & Synthesis Types
export type {
  MusicalScaleType,
  AmbientPresetType,
  AudioMoodConfig,
  GameAudioEventType,
  GameEventType,
  GameAudioEventMeta,
  AudioEngineStatus,
  AudioManagerStatus,
  SoundEffectOptions,
  MasterAudioBusConfig,
  SynthEnvelopeConfig,
  SoundEffectPresetConfig,
  AmbientPresetConfig,
} from './types/audio.types';

// ============================================================================
// 2. React Hooks
// ============================================================================

export {
  useSpeechRecognition,
} from './hooks/useSpeechRecognition';

export {
  useGameAudioEvents,
  CANONICAL_GAME_AUDIO_EVENTS,
  resolveCanonicalAudioEvent,
  resetGameAudioEventsCache,
} from './hooks/useGameAudioEvents';
export type { UseGameAudioEventsOptions } from './hooks/useGameAudioEvents';

// ============================================================================
// 3. UI Components
// ============================================================================

export {
  VoiceController,
} from './components/VoiceController';
export type { VoiceControllerProps } from './components/VoiceController';

export {
  AudioControls,
} from './components/AudioControls';
export type { AudioControlsProps } from './components/AudioControls';

// ============================================================================
// 4. Centralized Audio Pipeline (audioManager)
// ============================================================================

export {
  initializeAudio,
  setVolume,
  setMasterVolume,
  getVolume,
  getMasterVolume,
  muteAudio,
  muteMasterAudio,
  unmuteAudio,
  unmuteMasterAudio,
  isAudioInitialized,
  getAudioStatus,
  getMasterAudioStatus,
  disposeAudio,
  connectToMasterBus,
} from './audio/audioManager';

// ============================================================================
// 5. Ambient Audio Synthesizer (ambientAudio)
// ============================================================================

export {
  startAmbientAudio,
  stopAmbientAudio,
  changeAmbientPreset,
  updateAmbientMood,
  setAmbientVolume,
  getAmbientStatus,
  disposeAmbientAudio,
} from './audio/ambientAudio';

// ============================================================================
// 6. Procedural Sound Effects Engine (soundEffects)
// ============================================================================

export {
  initializeSoundEffects,
  playSoundEffect,
  setSoundEffectsVolume,
  muteSoundEffects,
  unmuteSoundEffects,
  getSoundEffectsStatus,
  disposeSoundEffects,
} from './audio/soundEffects';

// ============================================================================
// 7. Audio Configurations & Metadata (audioConfig)
// ============================================================================

export {
  DEFAULT_MASTER_BUS_CONFIG,
  AUDIO_MOOD_SCALES,
  AMBIENT_PRESETS,
  GAME_AUDIO_EVENTS_META,
} from './utils/audioConfig';
