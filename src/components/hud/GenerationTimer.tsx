import React, { useEffect, useState, useRef } from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const GenerationTimer: React.FC = () => {
  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);
  const generationStartedAt = useDreamStore((state) => state.generationStartedAt);
  const serverGenerationTimeMs = useDreamStore((state) => state.serverGenerationTimeMs);
  
  // Continuous live session timer tracking actual elapsed time
  const [sessionTime, setSessionTime] = useState('00:00');
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      setSessionTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generation-to-playable stopwatch
  const [displayGenTime, setDisplayGenTime] = useState('00:00.000');
  const animFrameRef = useRef<number | null>(null);
  const genStartRef = useRef<number | null>(null);

  useEffect(() => {
    const isGenerating =
      lifecyclePhase === 'generating' ||
      lifecyclePhase === 'validating' ||
      lifecyclePhase === 'loading-assets' ||
      lifecyclePhase === 'initializing-scene' ||
      lifecyclePhase === 'initializing-physics';

    if (isGenerating) {
      if (genStartRef.current === null) {
        genStartRef.current = performance.now();
      }

      const updateGenTimer = () => {
        if (genStartRef.current === null) return;
        const elapsedMs = performance.now() - genStartRef.current;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor(elapsedMs % 1000);

        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
        setDisplayGenTime(formatted);

        animFrameRef.current = requestAnimationFrame(updateGenTimer);
      };

      animFrameRef.current = requestAnimationFrame(updateGenTimer);
    } else if (lifecyclePhase === 'ready' || lifecyclePhase === 'playing') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      genStartRef.current = null;
    } else if (lifecyclePhase === 'idle') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      genStartRef.current = null;
      setDisplayGenTime('00:00.000');
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [lifecyclePhase, generationStartedAt]);

  const isGenActive =
    lifecyclePhase === 'generating' ||
    lifecyclePhase === 'validating' ||
    lifecyclePhase === 'loading-assets' ||
    lifecyclePhase === 'ready' ||
    lifecyclePhase === 'playing';

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-md font-mono">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
        Session:
      </span>
      <span className="text-xs font-bold text-slate-200 tracking-wide">
        {sessionTime}
      </span>

      {isGenActive && (
        <div className="flex items-center gap-1.5 border-l border-slate-700/80 pl-2">
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider">
            Playable:
          </span>
          <span className="text-xs font-bold text-cyan-300">
            {displayGenTime}
          </span>
          {serverGenerationTimeMs !== null && (
            <span className="text-[10px] text-indigo-300 hidden sm:inline">
              ({serverGenerationTimeMs}ms)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
