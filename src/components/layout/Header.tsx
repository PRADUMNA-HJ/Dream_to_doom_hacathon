import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              Dream-to-Doom
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800 font-mono">
              Phase 1: Foundation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Speak Your Imagination. Watch It Become Reality.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-4">
          <span>Branch: feature/person1-foundation</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>
    </header>
  );
};
