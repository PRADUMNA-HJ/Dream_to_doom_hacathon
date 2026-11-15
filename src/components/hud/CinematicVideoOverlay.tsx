import React, { useState } from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { useSpeechInput } from '../../sensory/useSpeechInput';
import { generateWorldFromTranscript } from '../../services/worldGenerationController';
import { soundEngine } from '../../sensory/SoundEngine';

export const CinematicVideoOverlay: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const cinematicProgress = useDreamStore((state) => state.cinematicProgress);
  const isCinematicPlaying = useDreamStore((state) => state.isCinematicPlaying);
  const setCinematicProgress = useDreamStore((state) => state.setCinematicProgress);
  const setCinematicPlaying = useDreamStore((state) => state.setCinematicPlaying);
  const restartCinematic = useDreamStore((state) => state.restartCinematic);
  const resetSession = useDreamStore((state) => state.resetSession);
  const isAudioInitialized = useDreamStore((state) => state.isAudioInitialized);

  const {
    transcript,
    isListening,
    toggleListening,
    setTranscript,
    clearTranscript,
  } = useSpeechInput();

  const [bottomInput, setBottomInput] = useState('');

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

  const handleNextPrompt = async (promptText?: string) => {
    const textToSend = promptText || bottomInput || transcript;
    if (!textToSend.trim()) return;

    if (!isAudioInitialized) {
      soundEngine.initAudio();
    }

    setTranscript(textToSend);
    await generateWorldFromTranscript(textToSend);
    setBottomInput('');
    clearTranscript();
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Top Cinema Letterbox Bar */}
      <div className="w-full bg-gradient-to-b from-black via-black/90 to-transparent pt-3 pb-8 px-6 pointer-events-auto flex items-center justify-between gap-4">
        {/* Left: Recording Status & Timecode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-800/80">
            <span
              className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${
                isCinematicPlaying ? 'animate-pulse' : 'opacity-60'
              }`}
            />
            <span className="text-[10px] font-mono font-bold tracking-widest text-rose-300 uppercase">
              {isCinematicPlaying ? 'REC • 10s Video' : isFinished ? '10s Ended' : 'Paused'}
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-300">
            <span className="text-cyan-400 font-bold">{cinematicProgress.toFixed(1)}s</span>
            <span className="text-slate-500"> / 10.0s</span>
          </div>
        </div>

        {/* Center: World Concept Title */}
        <div className="hidden md:flex flex-col items-center max-w-lg text-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-md">
              {world.title}
            </h2>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 uppercase">
              {world.biome}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 italic truncate max-w-lg">
            "{world.description}"
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restartCinematic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500 text-xs font-mono font-medium transition-all cursor-pointer"
            title="Replay 10-second video from start"
          >
            <span>↺ Replay</span>
          </button>
          <button
            type="button"
            onClick={resetSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md text-xs font-mono font-bold transition-all cursor-pointer"
            title="Create a new 10-second video for another idea"
          >
            <span>✨ New Idea</span>
          </button>
        </div>
      </div>

      {/* Floating Center Completion Banner at 10 seconds */}
      {isFinished && (
        <div className="self-center pointer-events-auto bg-slate-950/95 border border-cyan-500/80 rounded-2xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-md flex flex-col sm:flex-row items-center gap-5 animate-fade-in mb-4 max-w-lg">
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
              🎬
            </div>
            <div>
              <div className="text-sm font-bold text-white">10-Second Video Showcase Complete!</div>
              <div className="text-xs text-slate-400">
                Replay the video or enter your next idea in the bar below!
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restartCinematic}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>↺ Replay 10s</span>
            </button>
            <button
              type="button"
              onClick={resetSession}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>✨ New Idea</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Cinema Letterbox Bar & Controls & Quick Prompt Bar */}
      <div className="w-full bg-gradient-to-t from-black via-black/95 to-transparent pb-4 pt-8 px-6 pointer-events-auto space-y-3">
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

        {/* Video Controls & Shot Jump Toolbar */}
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
              title="Restart 10s video from 0.0s"
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
        </div>

        {/* Quick Next Prompt Bar (Docked right at bottom for instant iteration) */}
        <div className="pt-1">
          <div className="flex items-center gap-2 max-w-2xl mx-auto bg-slate-900/90 border border-slate-800/90 rounded-xl p-1.5 shadow-lg">
            {/* Mic button */}
            <button
              type="button"
              onClick={() => toggleListening()}
              className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title="Click to speak your next idea"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 02-3-3V5a3 3 0 116 0v6a3 3 0 02-3 3z"
                />
              </svg>
            </button>

            {/* Input field */}
            <input
              type="text"
              value={bottomInput || transcript}
              onChange={(e) => {
                setBottomInput(e.target.value);
                setTranscript(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextPrompt();
              }}
              placeholder={isListening ? 'Listening...' : 'Type another idea to generate next 10s video...'}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />

            {/* Generate button */}
            <button
              type="button"
              onClick={() => handleNextPrompt()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white cursor-pointer transition-all"
            >
              🎬 Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
