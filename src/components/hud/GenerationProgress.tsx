import React from 'react';
import { useDreamStore, type LifecyclePhase } from '../../store/useDreamStore';

export const GenerationProgress: React.FC = () => {
  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);

  const stages: Array<{ id: LifecyclePhase; label: string }> = [
    { id: 'listening', label: '1. Voice Input' },
    { id: 'generating', label: '2. Gemini AI' },
    { id: 'validating', label: '3. Zod Verify' },
    { id: 'loading-assets', label: '4. 3D Hydration' },
    { id: 'ready', label: '5. World Ready' },
  ];

  const getStageIndex = (phase: LifecyclePhase): number => {
    switch (phase) {
      case 'idle':
        return -1;
      case 'listening':
      case 'transcript-ready':
        return 0;
      case 'generating':
        return 1;
      case 'validating':
        return 2;
      case 'loading-assets':
      case 'initializing-scene':
      case 'initializing-physics':
        return 3;
      case 'ready':
      case 'playing':
      case 'paused':
        return 4;
      default:
        return -1;
    }
  };

  const currentIdx = getStageIndex(lifecyclePhase);
  if (currentIdx === -1) return null;

  return (
    <div className="bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-800/80 px-4 py-2.5 shadow-xl flex items-center gap-3">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <React.Fragment key={stage.id}>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-400'
                    : isCurrent
                    ? 'bg-cyan-400 animate-ping shadow-[0_0_10px_#22d3ee]'
                    : 'bg-slate-700'
                }`}
              />
              <span
                className={`text-[11px] font-mono tracking-wider transition-colors duration-300 ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <span className="text-slate-700 font-mono text-xs select-none">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
