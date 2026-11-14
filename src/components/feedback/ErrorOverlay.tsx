import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const ErrorOverlay: React.FC = () => {
  const generationError = useDreamStore((state) => state.generationError);
  const resetGeneration = useDreamStore((state) => state.resetGeneration);

  if (!generationError) return null;

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
        </div>
      </div>
    </div>
  );
};
