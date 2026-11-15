/**
 * Dream-to-Doom: Sensory Domain — Speech Recognition Types
 * Defines interfaces, status types, supported languages, and error definitions
 * for browser-native Web Speech API speech-to-text processing.
 */

/** Supported language codes for speech recognition */
export type SupportedLanguage =
  | 'en-US'
  | 'ta-IN'
  | 'kn-IN'
  | 'te-IN'
  | 'mr-IN'
  | 'bn-IN'
  | 'ml-IN'
  | 'hi-IN';

/** Metadata description for supported languages */
export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

/** Pre-configured supported languages */
export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en-US', label: 'English (US)', nativeLabel: 'English (United States)' },
  { code: 'ta-IN', label: 'Tamil (India)', nativeLabel: 'தமிழ் (இந்தியா)' },
  { code: 'kn-IN', label: 'Kannada (India)', nativeLabel: 'ಕನ್ನಡ (ಭಾರತ)' },
  { code: 'te-IN', label: 'Telugu (India)', nativeLabel: 'తెలుగు (భారతదేశం)' },
  { code: 'mr-IN', label: 'Marathi (India)', nativeLabel: 'मराठी (भारत)' },
  { code: 'bn-IN', label: 'Bengali (India)', nativeLabel: 'বাংলা (ভারত)' },
  { code: 'ml-IN', label: 'Malayalam (India)', nativeLabel: 'മലയാളം (ഇന്ത്യ)' },
  { code: 'hi-IN', label: 'Hindi (India)', nativeLabel: 'हिन्दी (भारत)' },
] as const;

/** Lifecycle status of speech recognition engine */
export type SpeechRecognitionStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'stopped'
  | 'error';

/** Browser microphone permission states */
export type MicrophonePermissionStatus =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

/** Web Speech API standardized error codes */
export type SpeechErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'unsupported-browser'
  | 'unknown';

/** Structured error representation */
export interface SpeechRecognitionError {
  code: SpeechErrorCode;
  message: string;
  fatal: boolean;
  originalError?: unknown;
}

/** Configuration options passed when initializing useSpeechRecognition hook */
export interface SpeechRecognitionOptions {
  /** Target recognition language (defaults to 'en-US') */
  lang?: SupportedLanguage | string;
  /** Keep listening across multiple pauses until explicitly stopped */
  continuous?: boolean;
  /** Return interim unfinalized results for real-time visual feedback */
  interimResults?: boolean;
  /** Maximum alternative transcript hypotheses to request */
  maxAlternatives?: number;
  /** Callback fired ONLY when a final transcript segment is confirmed */
  onFinalTranscript?: (transcript: string) => void;
  /** Callback fired for real-time interim speech chunks */
  onInterimTranscript?: (interim: string) => void;
  /** Callback fired when an error occurs */
  onError?: (error: SpeechRecognitionError) => void;
  /** Callback fired when recognition status transitions */
  onStatusChange?: (status: SpeechRecognitionStatus) => void;
}

/** Single recognized speech payload */
export interface SpeechRecognitionResultPayload {
  transcript: string;
  interimTranscript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

/** Provenance of prompt submission (voice recognition vs manual keyboard entry) */
export type PromptInputSource = 'voice' | 'manual';

/** Distinguishable submission payload for Zustand store and telemetry integration */
export interface PromptSubmissionPayload {
  /** The finalized prompt string */
  text: string;
  /** Submission origin ('voice' for speech recognition, 'manual' for keyboard fallback) */
  source: PromptInputSource;
  /** Language active during submission (e.g. 'en-US' or 'ta-IN') */
  language?: SupportedLanguage | string;
  /** Speech recognition confidence score (0.0 - 1.0) when source is 'voice' */
  confidence?: number;
  /** Epoch timestamp of submission */
  timestamp: number;
}

/** Complete contract returned by the useSpeechRecognition hook */
export interface UseSpeechRecognitionReturn {
  /** Accumulated finalized transcript text */
  transcript: string;
  /** Current active, unfinalized speech hypothesis */
  interimTranscript: string;
  /** True while the microphone and speech engine are actively capturing */
  isListening: boolean;
  /** True if the active browser implements Web Speech API */
  isSupported: boolean;
  /** Current lifecycle status */
  status: SpeechRecognitionStatus;
  /** Last recorded error, or null if healthy */
  error: SpeechRecognitionError | null;
  /** Currently configured language code */
  language: SupportedLanguage | string;
  /** Browser microphone permission status */
  permissionStatus: MicrophonePermissionStatus;
  /** Recognition confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Initiates microphone capture and speech recognition */
  startListening: (customLang?: SupportedLanguage | string) => Promise<void>;
  /** Safely stops active listening session and cleans up resources */
  stopListening: () => void;
  /** Clears both accumulated transcript and interim transcript buffers */
  clearTranscript: () => void;
  /** Updates the active language without restarting if idle */
  setLanguage: (lang: SupportedLanguage | string) => void;
}

