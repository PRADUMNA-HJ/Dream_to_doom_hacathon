import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { GenerationProgress } from '../hud/GenerationProgress';
import { GenerationTimer } from '../hud/GenerationTimer';

export const LoadingOverlay: React.FC = () => {
  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);

  const isLoading =
    lifecyclePhase === 'generating' ||
    lifecyclePhase === 'validating' ||
    lifecyclePhase === 'loading-assets' ||
    lifecyclePhase === 'initializing-scene' ||
    lifecyclePhase === 'initializing-physics';

  if (!isLoading) return null;

  const getStageTitle = () => {
    switch (lifecyclePhase) {
      case 'generating':
        return 'Google Gemini 3.8 Flash Synthesizing Scene Graph...';
      case 'validating':
        return 'Verifying Scene Graph via Zod Contract...';
      case 'loading-assets':
        return 'Instantiating 3D Primitives & Materials...';
      case 'initializing-scene':
        return 'Mounting WebGL Scenegraph & Camera...';
      case 'initializing-physics':
        return 'Building Rapier Physics Collision Matrix...';
      default:
        return 'Materializing World...';
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-6 pointer-events-auto transition-opacity duration-500">
      {/* Animated Hexagonal Pulse */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-cyan-400/50 animate-spin shadow-[0_0_30px_#22d3ee44]" />
        <div className="absolute w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 animate-pulse flex items-center justify-center text-white font-mono font-bold text-lg">
          3D
        </div>
      </div>

      {/* Stage Text & Timer */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-sm font-mono font-bold text-cyan-300 tracking-wider">
          {getStageTitle()}
        </h3>
        <p className="text-xs text-slate-400 font-sans">
          Converting spoken concepts into deterministic spatial coordinates and collision bodies.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <GenerationTimer />
        <GenerationProgress />
      </div>
    </div>
  );
};
