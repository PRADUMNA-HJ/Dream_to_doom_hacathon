import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const GameOverOverlay: React.FC = () => {
  const playerHealth = useDreamStore((state) => state.playerHealth);
  const world = useDreamStore((state) => state.world);
  const score = useDreamStore((state) => state.score);
  const restartGame = useDreamStore((state) => state.restartGame);
  const resetWorld = useDreamStore((state) => state.resetWorld);

  // Only display when a world is active and player health is 0
  if (!world || playerHealth > 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl p-6 text-center space-y-5 animate-in fade-in duration-300">
        {/* Skull Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center text-3xl shadow-lg shadow-rose-950/50">
          💀
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-wider uppercase bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            Game Over
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Your journey in {world.title} came to an end.
          </p>
        </div>

        {/* Final Score Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            Final Score
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            ★ {score}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={restartGame}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold font-mono tracking-wider text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-cyan-900/30 active:scale-95 transition-all cursor-pointer"
          >
            ↺ Restart World
          </button>
          <button
            type="button"
            onClick={resetWorld}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold font-mono tracking-wider text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            Return to Main Screen
          </button>
        </div>
      </div>
    </div>
  );
};
