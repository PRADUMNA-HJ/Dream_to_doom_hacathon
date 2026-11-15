import { useState } from 'react';
import { useDreamStore } from '../store/useDreamStore';
import { speechController } from './SpeechController';
import type { SupportedLanguage } from './types/speech.types';

export function useSpeechInput() {
  const transcript = useDreamStore((state) => state.transcript);
  const isListening = useDreamStore((state) => state.isListening);
  const speechError = useDreamStore((state) => state.speechError);
  const setTranscript = useDreamStore((state) => state.setTranscript);
  const clearTranscript = useDreamStore((state) => state.clearTranscript);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage | string>(
    speechController.getLanguage()
  );

  const isSupported = speechController.getSupported();

  const handleSetLanguage = (lang: SupportedLanguage | string) => {
    speechController.setLanguage(lang);
    setCurrentLanguage(lang);
  };

  const toggleListening = (lang?: SupportedLanguage | string) => {
    if (isListening) {
      speechController.stopListening();
    } else {
      speechController.startListening(lang || currentLanguage);
    }
  };

  return {
    transcript,
    isListening,
    speechError,
    isSupported,
    currentLanguage,
    setLanguage: handleSetLanguage,
    startListening: (lang?: SupportedLanguage | string) =>
      speechController.startListening(lang || currentLanguage),
    stopListening: () => speechController.stopListening(),
    toggleListening,
    setTranscript,
    clearTranscript,
  };
}
