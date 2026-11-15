import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const WorldStatusPanel: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const score = useDreamStore((state) => state.score);
  const playerHealth = useDreamStore((state) => state.playerHealth);
  const isGameStarted = useDreamStore((state) => state.isGameStarted);
  const collectedEntityIds = useDreamStore((state) => state.collectedEntityIds);

  if (!world) return null;

  const totalCrystals = world.entities.filter((e) => e.interaction === 'collectible').length;
  const collectedCrystals = world.entities.filter(
    (e) => e.interaction === 'collectible' && collectedEntityIds.includes(e.id)
  ).length;

  return (
    <div className="bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-2xl max-w-xs w-full space-y-3 font-sans pointer-events-auto">
      {/* Header & Biome */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
            {world.title}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
            {world.description}
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider shrink-0">
          {world.biome}
        </span>
      </div>

      {/* Gameplay Stats: Health, Score & Crystals */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Health
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  playerHealth > 50
                    ? 'bg-emerald-500'
                    : playerHealth > 25
                    ? 'bg-amber-500'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${playerHealth}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-white">{playerHealth}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Score
          </div>
          <div className="font-mono text-sm font-black text-amber-400">
            ★ {score}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Crystals
          </div>
          <div className="font-mono text-xs font-bold text-cyan-300">
            💎 {collectedCrystals}/{totalCrystals}
          </div>
        </div>
      </div>

      {/* Atmospheric Telemetry */}
      <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
        <div className="flex justify-between">
          <span>Audio Mood:</span>
          <span className="text-indigo-300 font-semibold">{world.audioMood}</span>
        </div>
        <div className="flex justify-between">
          <span>Weather:</span>
          <span className="text-cyan-300">{world.weather.type} ({Math.round(world.weather.intensity * 100)}%)</span>
        </div>
        <div className="flex justify-between">
          <span>Spawned Entities:</span>
          <span className="text-white font-bold">{world.entities.length}</span>
        </div>
      </div>

      {/* Controls Guide */}
      {isGameStarted && (
        <div className="text-[10px] font-mono text-slate-400 text-center border-t border-slate-800/60 pt-2 space-y-0.5">
          <div>
            Move: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">W</kbd>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 ml-0.5">A</kbd>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 ml-0.5">S</kbd>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 ml-0.5">D</kbd> | Jump: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">Space</kbd>
          </div>
          <div className="text-[9px] text-slate-500">
            Sprint: <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Shift</kbd> | Portal: Step to Warp
          </div>
        </div>
      )}
    </div>
  );
};
