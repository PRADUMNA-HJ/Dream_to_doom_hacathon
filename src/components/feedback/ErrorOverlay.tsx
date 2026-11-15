import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { DEFAULT_MOCK_WORLD } from '../../shared/constants';
import { soundEngine } from '../../sensory/SoundEngine';

export const ErrorOverlay: React.FC = () => {
  const generationError = useDreamStore((state) => state.generationError);
  const resetGeneration = useDreamStore((state) => state.resetGeneration);
  const isAudioInitialized = useDreamStore((state) => state.isAudioInitialized);

  if (!generationError) return null;

  const handleLoadDemo = () => {
    resetGeneration();
    if (!isAudioInitialized) {
      soundEngine.initAudio();
    }
    useDreamStore.getState().setWorld(DEFAULT_MOCK_WORLD, 'demo_world');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <div>
          <h3 className="text-base font-bold text-white">World Generation Error</h3>
          <p className="text-xs text-rose-300 font-mono mt-2 bg-rose-950/40 p-3 rounded-xl border border-rose-900/60 break-words text-left">
            {generationError}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={resetGeneration}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
          >
            Load Demo World
          </button>
        </div>
      </div>
    </div>
  );
};
