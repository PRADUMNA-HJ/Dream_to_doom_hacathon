import React, { useEffect } from 'react';
import { AudioControls } from '../../sensory/components/AudioControls';
import { useDreamStore } from '../../store/useDreamStore';

interface AudioSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSuiteModal: React.FC<AudioSuiteModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
              🎛️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Sensory Audio Engine Suite
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Tone.js Procedural Pipeline • Ambient Soundscapes & SFX Matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Modal Body hosting Person 3's AudioControls */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          <AudioControls
            showSfxPreview={true}
            onStatusChange={(status) => {
              useDreamStore.getState().setMuted(status.isMuted);
              useDreamStore.getState().setAudioVolume(status.masterVolume);
              useDreamStore.getState().setAudioInitialized(status.isInitialized);
            }}
          />
        </div>
      </div>
    </div>
  );
};
