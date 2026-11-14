/// <reference path="./types/react-ambient.d.ts" />
/// <reference path="./types/tone-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Public Entry Point (Barrel Export)
 *
 * Provides a unified public API for Person 1 (Lead / State) and Person 2 (3D World / Physics).
 * Allows downstream modules to import all sensory components, hooks, procedural sound
 * engines, master audio bus controls, and TypeScript interfaces without coupling to
 * internal directory structures.
 */

// ============================================================================
// 1. UI Components & Component Prop Interfaces
// ============================================================================

export { VoiceController } from './components/VoiceController';
export type { VoiceControllerProps } from './components/VoiceController';

export { AudioControls } from './components/AudioControls';
export type { AudioControlsProps } from './components/AudioControls';

// ============================================================================
// 2. React Sensory Hooks & Hook Interfaces
// ============================================================================

export { useSpeechRecognition } from './hooks/useSpeechRecognition';

export {
  useGameAudioEvents,
  CANONICAL_GAME_AUDIO_EVENTS,
  resolveCanonicalAudioEvent,
  resetGameAudioEventsCache,
} from './hooks/useGameAudioEvents';
export type { UseGameAudioEventsOptions } from './hooks/useGameAudioEvents';

// ============================================================================
// 3. Centralized Master Audio Pipeline (audioManager)
// ============================================================================

// Canonical Master Bus Aliases
export {
  initializeAudio,
  setVolume,
  getVolume,
  muteAudio,
  unmuteAudio,
  getAudioStatus,
  isAudioInitialized,
  connectToMasterBus,
  getMasterBusInput,
  disposeAudio,
  setMasterVolume,
  getMasterVolume,
  muteMasterAudio,
  unmuteMasterAudio,
  getMasterAudioStatus,
} from './audio/audioManager';

// ============================================================================
// 4. Procedural Ambient Audio Synthesizer (ambientAudio)
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
// 5. Procedural Sound Effects Engine (soundEffects)
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
// 6. Speech Recognition Types & Language Configurations
// ============================================================================

export { SUPPORTED_LANGUAGES } from './types/speech.types';

export type {
  SupportedLanguage,
  LanguageOption,
  SpeechRecognitionStatus,
  MicrophonePermissionStatus,
  SpeechErrorCode,
  SpeechRecognitionError,
  SpeechRecognitionOptions,
  SpeechRecognitionResultPayload,
  PromptInputSource,
  PromptSubmissionPayload,
  UseSpeechRecognitionReturn,
} from './types/speech.types';

// ============================================================================
// 7. Audio Engine Types & Sound Preset Contracts
// ============================================================================

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
// 8. Audio Presets & Default Configurations (audioConfig)
// ============================================================================

export {
  DEFAULT_MASTER_AUDIO_CONFIG,
  DEFAULT_MASTER_BUS_CONFIG,
  DEFAULT_AUDIO_MOOD,
  MUSICAL_SCALES,
  AUDIO_MOOD_SCALES,
  AMBIENT_PRESETS,
  SOUND_EFFECT_PRESETS,
  GAME_AUDIO_EVENTS_META,
} from './utils/audioConfig';
