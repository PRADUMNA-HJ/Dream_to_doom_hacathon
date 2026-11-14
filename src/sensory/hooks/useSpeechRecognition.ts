/**
 * Dream-to-Doom: Sensory Domain — Speech Recognition Hook
 * Reusable React hook for Web Speech API integration with continuous speech-to-text,
 * multi-language support (en-US, ta-IN), interim/final transcript isolation,
 * permission tracking, and robust error normalization.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  MicrophonePermissionStatus,
  SpeechErrorCode,
  SpeechRecognitionError,
  SpeechRecognitionOptions,
  SpeechRecognitionStatus,
  SupportedLanguage,
  UseSpeechRecognitionReturn,
} from '../types/speech.types';

// ============================================================================
// Internal Web Speech API Interfaces (Polyfill & Vendor-Prefix Type Safety)
// ============================================================================

interface IWindowSpeechRecognition {
  new (): ISpeechRecognitionInstance;
}

interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionEvent) => void) | null;
  onaudiostart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

// ============================================================================
// Helper: Resolve Native or Prefixed SpeechRecognition Constructor
// ============================================================================

const getSpeechRecognitionConstructor = (): IWindowSpeechRecognition | null => {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: IWindowSpeechRecognition;
    webkitSpeechRecognition?: IWindowSpeechRecognition;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
};

// ============================================================================
// Helper: Normalize Web Speech API Errors
// ============================================================================

const normalizeSpeechError = (
  rawError: string,
  originalEvent?: unknown
): SpeechRecognitionError => {
  let code: SpeechErrorCode = 'unknown';
  let message = 'An unexpected speech recognition error occurred.';
  let fatal = true;

  switch (rawError) {
    case 'not-allowed':
      code = 'not-allowed';
      message = 'Microphone access was denied. Please allow microphone access in your browser settings.';
      break;
    case 'service-not-allowed':
      code = 'service-not-allowed';
      message = 'Speech recognition service is not allowed or restricted by your browser policies.';
      break;
    case 'no-speech':
      code = 'no-speech';
      message = 'No speech was detected. Please speak into your microphone.';
      fatal = false; // Non-fatal: user simply didn't speak
      break;
    case 'audio-capture':
      code = 'audio-capture';
      message = 'No microphone was found or microphone is currently in use by another application.';
      break;
    case 'network':
      code = 'network';
      message = 'Network connection error. Web Speech API requires an active internet connection for cloud recognition.';
      break;
    case 'aborted':
      code = 'aborted';
      message = 'Speech recognition was stopped or aborted.';
      fatal = false; // Non-fatal: deliberate stop or restart
      break;
    case 'bad-grammar':
      code = 'bad-grammar';
      message = 'Speech grammar error occurred.';
      break;
    case 'language-not-supported':
      code = 'language-not-supported';
      message = 'The selected language is not supported by your browser speech engine.';
      break;
    case 'unsupported-browser':
      code = 'unsupported-browser';
      message = 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Brave.';
      break;
    default:
      code = 'unknown';
      message = `Speech recognition error: ${rawError || 'unknown'}`;
  }

  return { code, message, fatal, originalError: originalEvent };
};

// ============================================================================
// Main Hook Implementation: useSpeechRecognition
// ============================================================================

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onFinalTranscript,
    onInterimTranscript,
    onError,
    onStatusChange,
  } = options;

  // State slices
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [error, setError] = useState<SpeechRecognitionError | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage | string>(lang);
  const [permissionStatus, setPermissionStatus] = useState<MicrophonePermissionStatus>('prompt');
  const [confidence, setConfidence] = useState<number>(0);

  // References to keep callbacks and instances stable
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const processedIndicesRef = useRef<Set<number>>(new Set());
  const transcriptRef = useRef<string>('');
  const lastDispatchedTranscriptRef = useRef<string>('');
  const optionsRef = useRef<SpeechRecognitionOptions>(options);

  // Keep options reference synchronized without re-triggering effects
  useEffect(() => {
    optionsRef.current = {
      lang,
      continuous,
      interimResults,
      maxAlternatives,
      onFinalTranscript,
      onInterimTranscript,
      onError,
      onStatusChange,
    };
  }, [
    lang,
    continuous,
    interimResults,
    maxAlternatives,
    onFinalTranscript,
    onInterimTranscript,
    onError,
    onStatusChange,
  ]);

  // Synchronize language state if prop changes externally
  useEffect(() => {
    setLanguageState(lang);
  }, [lang]);

  // Status transition notifier
  const updateStatus = useCallback((nextStatus: SpeechRecognitionStatus) => {
    if (!isMountedRef.current) return;
    setStatus(nextStatus);
    optionsRef.current.onStatusChange?.(nextStatus);
  }, []);

  // Web Speech API browser support detection
  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionConstructor() !== null;

  // Check microphone permissions via Permissions API if available
  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupported) {
      setPermissionStatus('unsupported');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((permissionDesc) => {
          if (!isMountedRef.current) return;
          setPermissionStatus(permissionDesc.state as MicrophonePermissionStatus);

          permissionDesc.onchange = () => {
            if (!isMountedRef.current) return;
            setPermissionStatus(permissionDesc.state as MicrophonePermissionStatus);
          };
        })
        .catch(() => {
          // Permissions API query for microphone not supported in all browsers (e.g. Firefox)
          // Default remains 'prompt'
        });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isSupported]);

  // Stop active listening session
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
    setInterimTranscript('');
    updateStatus('stopped');
  }, [updateStatus]);

  // Start listening session
  const startListening = useCallback(
    async (customLang?: SupportedLanguage | string) => {
      const activeLanguage = customLang || language;

      if (!isSupported) {
        const unsupportedErr = normalizeSpeechError('unsupported-browser');
        setError(unsupportedErr);
        updateStatus('error');
        optionsRef.current.onError?.(unsupportedErr);
        return;
      }

      const SpeechConstructor = getSpeechRecognitionConstructor();
      if (!SpeechConstructor) return;

      // If an existing instance is active, abort it cleanly before creating a new one
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort errors
        }
        recognitionRef.current = null;
      }

      isManuallyStoppedRef.current = false;
      processedIndicesRef.current.clear();
      setInterimTranscript('');
      setError(null);
      updateStatus('starting');

      try {
        const recognition = new SpeechConstructor();
        recognitionRef.current = recognition;

        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = maxAlternatives;
        recognition.lang = activeLanguage;

        // Lifecycle: Session started
        recognition.onstart = () => {
          if (!isMountedRef.current) return;
          setIsListening(true);
          updateStatus('listening');
          setPermissionStatus('granted');
        };

        // Lifecycle: Sound / speech detected
        recognition.onaudiostart = () => {
          if (!isMountedRef.current) return;
          updateStatus('listening');
        };

        recognition.onaudioend = () => {
          if (!isMountedRef.current) return;
          // Audio buffer ended
        };

        // Lifecycle: Process incoming speech chunks
        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          if (!isMountedRef.current) return;

          let currentInterim = '';
          let newlyFinalizedChunk = '';
          let latestConfidence = 0;

          // Iterate through current results batch starting from resultIndex
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const alternative = result[0];

            if (!alternative) continue;

            if (result.isFinal) {
              // Ensure we do not process the same finalized index twice
              if (!processedIndicesRef.current.has(i)) {
                processedIndicesRef.current.add(i);
                const chunkText = alternative.transcript.trim();
                if (chunkText) {
                  newlyFinalizedChunk = newlyFinalizedChunk
                    ? `${newlyFinalizedChunk} ${chunkText}`
                    : chunkText;
                }
                if (alternative.confidence > 0) {
                  latestConfidence = alternative.confidence;
                }
              }
            } else {
              // Aggregate interim speech text
              currentInterim += alternative.transcript;
            }
          }

          // Update interim transcript (kept local to hook)
          setInterimTranscript(currentInterim);
          if (currentInterim) {
            updateStatus('processing');
            optionsRef.current.onInterimTranscript?.(currentInterim);
          }

          // Update finalized transcript if a new final segment arrived
          if (newlyFinalizedChunk) {
            const previous = transcriptRef.current;
            const updated = previous
              ? `${previous} ${newlyFinalizedChunk}`
              : newlyFinalizedChunk;

            transcriptRef.current = updated;
            setTranscript(updated);

            // Fire callback strictly outside React state updater to prevent double firing in React StrictMode
            if (lastDispatchedTranscriptRef.current !== updated) {
              lastDispatchedTranscriptRef.current = updated;
              optionsRef.current.onFinalTranscript?.(updated);
            }

            if (latestConfidence > 0) {
              setConfidence(latestConfidence);
            }

            updateStatus(currentInterim ? 'processing' : 'listening');
          }
        };

        // Lifecycle: Handle errors
        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          if (!isMountedRef.current) return;

          const normalizedErr = normalizeSpeechError(event.error, event);
          setError(normalizedErr);

          if (event.error === 'not-allowed') {
            setPermissionStatus('denied');
          }

          if (normalizedErr.fatal) {
            setIsListening(false);
            updateStatus('error');
          }

          optionsRef.current.onError?.(normalizedErr);
        };

        // Lifecycle: Recognition session ended
        recognition.onend = () => {
          if (!isMountedRef.current) return;

          // If continuous listening is enabled and user did not explicitly stop, restart gracefully
          if (continuous && !isManuallyStoppedRef.current && isMountedRef.current) {
            try {
              recognition.start();
              return;
            } catch {
              // Browser may deny immediate restart, settle to idle
            }
          }

          setIsListening(false);
          setInterimTranscript('');
          updateStatus('idle');
        };

        // Trigger microphone capture
        recognition.start();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const normalizedErr = normalizeSpeechError('audio-capture', err);
        normalizedErr.message = `Failed to start speech recognition: ${errorMsg}`;
        setError(normalizedErr);
        setIsListening(false);
        updateStatus('error');
        optionsRef.current.onError?.(normalizedErr);
      }
    },
    [continuous, interimResults, language, maxAlternatives, isSupported, updateStatus]
  );

  // Clear accumulated and interim transcripts
  const clearTranscript = useCallback(() => {
    transcriptRef.current = '';
    lastDispatchedTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    processedIndicesRef.current.clear();
  }, []);

  // Update active language
  const setLanguage = useCallback(
    (nextLang: SupportedLanguage | string) => {
      setLanguageState(nextLang);
      // If currently listening, restart recognition session with new language
      if (isListening) {
        stopListening();
        // Give browser speech engine a moment to release before restarting
        setTimeout(() => {
          if (isMountedRef.current) {
            startListening(nextLang);
          }
        }, 150);
      }
    },
    [isListening, startListening, stopListening]
  );

  // Cleanup on unmount: Abort recognition and clear listeners
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    status,
    error,
    language,
    permissionStatus,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
    setLanguage,
  };
}
