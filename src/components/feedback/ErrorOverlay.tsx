import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { DEMO_PRESETS, DEMO_PRESET_WORLDS, DEFAULT_MOCK_WORLD, type WorldSpec } from '../../shared/constants';
import { soundEngine } from '../../sensory/SoundEngine';

export const ErrorOverlay: React.FC = () => {
  const generationError = useDreamStore((state) => state.generationError);
  const resetGeneration = useDreamStore((state) => state.resetGeneration);
  const isAudioInitialized = useDreamStore((state) => state.isAudioInitialized);

  if (!generationError) return null;

  const handleLoadPresetWorld = (presetWorld: WorldSpec) => {
    resetGeneration();
    if (!isAudioInitialized) {
      soundEngine.initAudio();
    }
    const requestId = `offline_req_${Date.now()}`;
    useDreamStore.getState().beginGeneration(requestId);
    useDreamStore.getState().setWorld(presetWorld, requestId, 0, true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <div>
          <h3 className="text-base font-bold text-white">World Generation Notice</h3>
          <p className="text-xs text-rose-300 font-mono mt-2 bg-rose-950/40 p-3 rounded-xl border border-rose-900/60 break-words text-left">
            {generationError}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Gemini AI requires an API key or active network connection. You can dismiss this alert or explore our pre-compiled 3D offline demo worlds below:
          </p>
        </div>

        {/* 3 Predefined Offline Demo Worlds */}
        <div className="space-y-2 pt-1 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Select Offline Demo World:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_PRESETS.map((preset) => {
              const presetWorld = DEMO_PRESET_WORLDS[preset.id] || DEFAULT_MOCK_WORLD;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPresetWorld(presetWorld)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-600/80 transition-all text-left group cursor-pointer"
                >
                  <div className="text-sm">{preset.icon}</div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 mt-1">
                    {preset.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                    {preset.expectedBiome}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={resetGeneration}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
