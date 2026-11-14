import { useDreamStore } from '../store/useDreamStore';

// Type definitions for browser Web Speech API
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class SpeechController {
  private recognition: SpeechRecognitionInstance | null = null;
  private isSupported: boolean = false;
  private isSessionActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionCtor) {
        this.isSupported = true;
        try {
          this.recognition = new SpeechRecognitionCtor();
          this.recognition.continuous = false; // Single utterance mode for discrete world prompts
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onstart = () => {
            this.isSessionActive = true;
            useDreamStore.getState().setListening(true);
            useDreamStore.getState().addTelemetryLog('voice-listening', 'Microphone active, listening for prompt...');
          };

          this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += text;
              } else {
                interimTranscript += text;
              }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            if (currentTranscript.trim()) {
              useDreamStore.getState().setTranscript(currentTranscript.trim());
            }
          };

          this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
            this.isSessionActive = false;
            let errorMessage = `Speech recognition error: ${event.error}`;

            switch (event.error) {
              case 'not-allowed':
                errorMessage = 'Microphone permission denied. Please enable mic access in your browser.';
                break;
              case 'no-speech':
                errorMessage = 'No speech detected. Please try speaking again.';
                break;
              case 'network':
                errorMessage = 'Speech recognition network error. Use text prompt fallback.';
                break;
              case 'audio-capture':
                errorMessage = 'No microphone device found on your system.';
                break;
            }

            useDreamStore.getState().setSpeechError(errorMessage);
            useDreamStore.getState().addTelemetryLog('voice-error', errorMessage);
          };

          this.recognition.onend = () => {
            this.isSessionActive = false;
            useDreamStore.getState().setListening(false);
          };
        } catch (err) {
          console.warn('[SpeechController] Failed to initialize SpeechRecognition:', err);
          this.isSupported = false;
        }
      }
    }
  }

  public getSupported(): boolean {
    return this.isSupported;
  }

  public getIsActive(): boolean {
    return this.isSessionActive;
  }

  public startListening(): boolean {
    if (!this.isSupported || !this.recognition) {
      useDreamStore.getState().setSpeechError(
        'Speech recognition is not supported in this browser. Please use the text input below.'
      );
      return false;
    }

    if (this.isSessionActive) {
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.error('[SpeechController] Start failed:', err);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isSessionActive) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[SpeechController] Stop failed:', err);
      }
    }
    this.isSessionActive = false;
    useDreamStore.getState().setListening(false);
  }
}

export const speechController = new SpeechController();
