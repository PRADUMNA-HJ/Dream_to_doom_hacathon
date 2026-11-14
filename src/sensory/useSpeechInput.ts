import { useDreamStore } from '../store/useDreamStore';
import { speechController } from './SpeechController';

export function useSpeechInput() {
  const transcript = useDreamStore((state) => state.transcript);
  const isListening = useDreamStore((state) => state.isListening);
  const speechError = useDreamStore((state) => state.speechError);
  const setTranscript = useDreamStore((state) => state.setTranscript);
  const clearTranscript = useDreamStore((state) => state.clearTranscript);

  const isSupported = speechController.getSupported();

  const toggleListening = () => {
    if (isListening) {
      speechController.stopListening();
    } else {
      speechController.startListening();
    }
  };

  return {
    transcript,
    isListening,
    speechError,
    isSupported,
    startListening: () => speechController.startListening(),
    stopListening: () => speechController.stopListening(),
    toggleListening,
    setTranscript,
    clearTranscript,
  };
}
