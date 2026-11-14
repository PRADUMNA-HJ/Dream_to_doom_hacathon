import React, { useEffect, useState, useRef } from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const GenerationTimer: React.FC = () => {
  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);
  const generationStartedAt = useDreamStore((state) => state.generationStartedAt);
  const serverGenerationTimeMs = useDreamStore((state) => state.serverGenerationTimeMs);
  const [displayTime, setDisplayTime] = useState('00:00.000');
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const isGenerating =
      lifecyclePhase === 'generating' ||
      lifecyclePhase === 'validating' ||
      lifecyclePhase === 'loading-assets' ||
      lifecyclePhase === 'initializing-scene' ||
      lifecyclePhase === 'initializing-physics';

    if (isGenerating) {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
      }

      const updateTimer = () => {
        if (startTimeRef.current === null) return;
        const elapsedMs = performance.now() - startTimeRef.current;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor(elapsedMs % 1000);

        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
        setDisplayTime(formatted);

        animFrameRef.current = requestAnimationFrame(updateTimer);
      };

      animFrameRef.current = requestAnimationFrame(updateTimer);
    } else if (lifecyclePhase === 'ready' || lifecyclePhase === 'playing') {
      // World is ready: stop animating and finalize elapsed duration
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      startTimeRef.current = null;
    } else if (lifecyclePhase === 'idle') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      startTimeRef.current = null;
      setDisplayTime('00:00.000');
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [lifecyclePhase, generationStartedAt]);

  const isTimerActive =
    lifecyclePhase === 'generating' ||
    lifecyclePhase === 'validating' ||
    lifecyclePhase === 'loading-assets' ||
    lifecyclePhase === 'ready' ||
    lifecyclePhase === 'playing';

  if (!isTimerActive) return null;

  return (
    <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-cyan-800/60 shadow-lg">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
        Playable:
      </span>
      <span className="font-mono text-sm font-bold tracking-widest text-cyan-300">
        {displayTime}
      </span>
      {serverGenerationTimeMs !== null && (
        <span className="text-[11px] font-mono text-indigo-400 border-l border-slate-700/80 pl-2">
          AI: <span className="text-indigo-200 font-semibold">{serverGenerationTimeMs}ms</span>
        </span>
      )}
    </div>
  );
};
