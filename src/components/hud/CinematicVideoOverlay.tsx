import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const CinematicVideoOverlay: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const viewMode = useDreamStore((state) => state.viewMode);
  const cinematicProgress = useDreamStore((state) => state.cinematicProgress);
  const isCinematicPlaying = useDreamStore((state) => state.isCinematicPlaying);
  const setViewMode = useDreamStore((state) => state.setViewMode);
  const setCinematicProgress = useDreamStore((state) => state.setCinematicProgress);
  const setCinematicPlaying = useDreamStore((state) => state.setCinematicPlaying);
  const restartCinematic = useDreamStore((state) => state.restartCinematic);

  if (!world) return null;

  const duration = 10.0;
  const progressPercent = Math.min(100, Math.max(0, (cinematicProgress / duration) * 100));
  const isFinished = cinematicProgress >= 9.95;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCinematicProgress(ratio * duration);
  };

  const jumpToShot = (seconds: number) => {
    setCinematicProgress(seconds);
    setCinematicPlaying(true);
  };

  // If in interactive mode, provide a compact floating trigger to return to video showcase
  if (viewMode === 'interactive') {
    return (
      <div className="absolute top-20 right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            setViewMode('cinematic');
            restartCinematic();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/85 hover:bg-indigo-950/90 text-cyan-300 hover:text-cyan-200 border border-cyan-800/80 hover:border-cyan-500 shadow-xl backdrop-blur-md transition-all font-mono text-xs font-semibold cursor-pointer group"
          title="Switch to automated 10-second cinematic drone video"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 group-hover:animate-ping" />
          <span>🎬 Watch 10s Video Showcase</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Top Cinema Letterbox Bar */}
      <div className="w-full bg-gradient-to-b from-black via-black/95 to-transparent pt-3 pb-8 px-6 pointer-events-auto flex items-center justify-between gap-4">
        {/* Left: Recording Status & Timecode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-800/80">
            <span
              className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${
                isCinematicPlaying ? 'animate-pulse' : 'opacity-60'
              }`}
            />
            <span className="text-[10px] font-mono font-bold tracking-widest text-rose-300 uppercase">
              {isCinematicPlaying ? 'REC • 10s Showcase' : isFinished ? 'Playback Ended' : 'Paused'}
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-300">
            <span className="text-cyan-400 font-bold">{cinematicProgress.toFixed(1)}s</span>
            <span className="text-slate-500"> / 10.0s</span>
          </div>
        </div>

        {/* Center: World Concept Title */}
        <div className="hidden md:flex flex-col items-center max-w-md text-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-xs">
              {world.title}
            </h2>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 uppercase">
              {world.biome}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 italic truncate max-w-md">
            "{world.description}"
          </p>
        </div>

        {/* Right: Switch to Interactive Mode button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40 text-xs font-mono font-bold transition-all cursor-pointer"
            title="Switch from video showcase to interactive third-person player controller"
          >
            <span>🎮 Switch to Interactive Play</span>
          </button>
        </div>
      </div>

      {/* Floating Center Completion Banner */}
      {isFinished && (
        <div className="self-center pointer-events-auto bg-slate-950/90 border border-cyan-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 animate-fade-in mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
              ✨
            </div>
            <div>
              <div className="text-xs font-bold text-white">10-Second Showcase Complete!</div>
              <div className="text-[11px] text-slate-400">
                You can replay the cinematic fly-through or explore the 3D world interactively.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restartCinematic}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>↺ Replay Video</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🎮 Play in 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Cinema Letterbox Bar & Video Scrubber */}
      <div className="w-full bg-gradient-to-t from-black via-black/95 to-transparent pb-4 pt-8 px-6 pointer-events-auto space-y-2.5">
        {/* Timeline Scrubber Bar */}
        <div
          onClick={handleSeek}
          className="relative w-full h-3 bg-slate-900/90 rounded-full overflow-hidden cursor-pointer border border-slate-800 hover:border-cyan-500/60 transition-colors group"
          title="Click to seek anywhere in the 10-second video"
        >
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 transition-all duration-75 relative rounded-full"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber thumb glow */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white shadow-[0_0_12px_#00e5ff] rounded-full" />
          </div>

          {/* Keyframe shot markers */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600/70"
            style={{ left: '32%' }}
            title="Act 2: Low Glide Sweep"
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600/70"
            style={{ left: '68%' }}
            title="Act 3: Portal Ascension"
          />
        </div>

        {/* Video Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Playback action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isFinished) {
                  restartCinematic();
                } else {
                  setCinematicPlaying(!isCinematicPlaying);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-all font-mono font-medium cursor-pointer"
            >
              <span>{isFinished ? '↺ Replay' : isCinematicPlaying ? '⏸️ Pause' : '▶️ Play'}</span>
            </button>

            <button
              type="button"
              onClick={restartCinematic}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all font-mono cursor-pointer"
              title="Restart 10s video tour from 0.0s"
            >
              <span>↺ Start Over</span>
            </button>
          </div>

          {/* Quick Shot Jump Chips */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Shots:</span>
            <button
              type="button"
              onClick={() => jumpToShot(0)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all cursor-pointer"
            >
              🔭 0s Wide Aerial
            </button>
            <button
              type="button"
              onClick={() => jumpToShot(3.2)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-all cursor-pointer"
            >
              🌲 3.2s Low Tour
            </button>
            <button
              type="button"
              onClick={() => jumpToShot(6.8)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-fuchsia-950 text-slate-400 hover:text-fuchsia-300 border border-slate-800 transition-all cursor-pointer"
            >
              🌀 6.8s Portal Rise
            </button>
          </div>

          {/* Direct CTA */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              Dual Mode Active: <strong className="text-cyan-300">10s Showcase</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
