import React, { useState } from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { GenerationTimer } from './GenerationTimer';
import { soundEngine } from '../../sensory/SoundEngine';
import { ArchitectureModal } from './ArchitectureModal';
import { AudioSuiteModal } from './AudioSuiteModal';
import { DEFAULT_MOCK_WORLD } from '../../shared/constants';

export const TopNav: React.FC = () => {
  const isAudioInitialized = useDreamStore((state) => state.isAudioInitialized);
  const isMuted = useDreamStore((state) => state.isMuted);
  const resetSession = useDreamStore((state) => state.resetSession);
  const world = useDreamStore((state) => state.world);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isAudioSuiteOpen, setIsAudioSuiteOpen] = useState(false);

  const handleAudioToggle = async () => {
    if (!isAudioInitialized) {
      await soundEngine.initAudio();
    } else {
      soundEngine.setMuted(!isMuted);
    }
  };

  const handleLoadDemoWorld = async () => {
    if (!isAudioInitialized) {
      await soundEngine.initAudio();
    }
    useDreamStore.getState().setWorld(DEFAULT_MOCK_WORLD, 'demo_world');
  };

  return (
    <>
      <header className="flex items-center justify-between gap-4 w-full px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 pointer-events-auto">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-base">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white bg-gradient-to-r from-cyan-400 via-indigo-200 to-fuchsia-400 bg-clip-text text-transparent">
                Dream-to-Doom
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-widest font-semibold">
                Live Demo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Speak Your Imagination. Watch It Become Reality.
            </p>
          </div>
        </div>

        {/* Center active world banner or stopwatch timer */}
        <div className="flex items-center gap-4">
          <GenerationTimer />
          {world && (
            <div className="hidden md:flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-200">{world.title}</span>
              <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-900/60">
                {world.biome}
              </span>
            </div>
          )}
        </div>

        {/* Controls: Architecture, Audio Suite, Quick Audio toggle & Reset */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsArchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-800 hover:border-cyan-800 transition-all cursor-pointer"
            title="Open Architecture & Technical Overview"
          >
            <span>📐 Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAudioSuiteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 hover:bg-indigo-950 text-indigo-300 border border-slate-800 hover:border-indigo-800 transition-all cursor-pointer"
            title="Open Tone.js Sensory Audio Engine Suite & Presets"
          >
            <span>🎛️ Audio Suite</span>
          </button>

          <button
            type="button"
            onClick={handleAudioToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
              !isAudioInitialized
                ? 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900'
                : isMuted
                ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900 shadow-sm'
            }`}
            title={!isAudioInitialized ? 'Click to enable Tone.js audio' : isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <span>{!isAudioInitialized ? '🔈 Enable Audio' : isMuted ? '🔇 Muted' : '🔊 Sound On'}</span>
          </button>

          {!world && (
            <button
              type="button"
              onClick={handleLoadDemoWorld}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              title="Instantly launch pre-built 3D demo world"
            >
              <span>✨ Load Demo World</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetSession}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition-all cursor-pointer"
          >
            Reset Session
          </button>
        </div>
      </header>

      {/* Architecture Modal Dialog */}
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />

      {/* Audio Engine Suite Modal Dialog (Person 3) */}
      <AudioSuiteModal isOpen={isAudioSuiteOpen} onClose={() => setIsAudioSuiteOpen(false)} />
    </>
  );
};
