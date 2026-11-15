import React, { useState, useEffect } from 'react';
import { useSpeechInput } from '../../sensory/useSpeechInput';
import { generateWorldFromTranscript } from '../../services/worldGenerationController';
import { useDreamStore } from '../../store/useDreamStore';
import { soundEngine } from '../../sensory/SoundEngine';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../sensory/types/speech.types';

const SAMPLE_IDEA_SPARKS = [
  { icon: '🏙️', text: 'Cyberpunk Rooftop in Neon Rain with Flying Vehicles' },
  { icon: '🍄', text: 'Giant Glowing Mushroom Kingdom with Bioluminescent Crystals' },
  { icon: '🌌', text: 'Space Nebula with Floating Ancient Pyramids and Stars' },
  { icon: '🍕', text: 'Flying Pizza Galaxy with Alien Robots and Neon Signs' },
  { icon: '🌋', text: 'Volcano Fortress with Molten Lava and Fire Drones' },
  { icon: '☁️', text: 'Ethereal Floating Islands in the Sky with Clouds' },
];

export const LandingHero: React.FC = () => {
  const {
    transcript,
    isListening,
    speechError,
    isSupported,
    currentLanguage,
    setLanguage,
    toggleListening,
    setTranscript,
    clearTranscript,
  } = useSpeechInput();

  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);
  const isAudioInitialized = useDreamStore((state) => state.isAudioInitialized);
  const [typedInput, setTypedInput] = useState('');

  const isGenerating =
    lifecyclePhase === 'generating' ||
    lifecyclePhase === 'validating' ||
    lifecyclePhase === 'loading-assets';

  const handleGenerate = async (customPrompt?: string) => {
    const promptToSend = customPrompt || typedInput || transcript;
    if (!promptToSend.trim()) return;

    if (!isAudioInitialized) {
      soundEngine.initAudio();
    }

    setTranscript(promptToSend);
    await generateWorldFromTranscript(promptToSend);
  };

  const handleSparkClick = async (sparkText: string) => {
    setTypedInput(sparkText);
    setTranscript(sparkText);
    await handleGenerate(sparkText);
  };

  // Support one-click direct demo via URL query parameter (e.g. ?prompt=Cyberpunk+City)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryPrompt = params.get('prompt');
    if (queryPrompt && queryPrompt.trim()) {
      handleSparkClick(queryPrompt.trim());
    }
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
      {/* Central Glassmorphic Card */}
      <div className="max-w-2xl w-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] space-y-6 text-center animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            🎬 On-The-Spot 10-Second Idea Video Generator
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white bg-gradient-to-r from-cyan-400 via-indigo-200 to-fuchsia-400 bg-clip-text text-transparent">
            Speak Your Idea. See It in 10 Seconds.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Speak or type any idea—serious, wild, surreal, or completely ridiculous—and watch a
            custom 10-second cinematic 3D video created on the spot!
          </p>
        </div>

        {/* Voice & Text Input Box */}
        <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 shadow-inner space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Voice or Text Input
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">Language:</span>
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                disabled={isListening || isGenerating}
                className="text-[10px] font-mono bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-cyan-300 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200">
                    {lang.label} ({lang.nativeLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Big Mic Button */}
            <button
              type="button"
              onClick={() => toggleListening()}
              disabled={!isSupported || isGenerating}
              className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold transition-all duration-300 cursor-pointer shadow-lg ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-[0_0_20px_#f43f5e]'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
              } ${!isSupported || isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={
                isSupported
                  ? isListening
                    ? 'Click to stop listening'
                    : 'Click to speak your idea'
                  : 'Speech recognition not supported in this browser'
              }
            >
              {isListening ? (
                <span className="flex h-4 w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
                </span>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 02-3-3V5a3 3 0 116 0v6a3 3 0 02-3 3z"
                  />
                </svg>
              )}
            </button>

            {/* Input Box */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={typedInput || transcript}
                onChange={(e) => {
                  setTypedInput(e.target.value);
                  setTranscript(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                placeholder={
                  isListening
                    ? 'Listening... Speak your idea now!'
                    : 'e.g., A neon cyberpunk city on fire with floating burger towers...'
                }
                disabled={isGenerating}
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
              {(typedInput || transcript) && (
                <button
                  type="button"
                  onClick={() => {
                    setTypedInput('');
                    clearTranscript();
                  }}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || (!typedInput.trim() && !transcript.trim())}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all cursor-pointer whitespace-nowrap ${
                isGenerating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 shadow-lg shadow-indigo-500/25 active:scale-95'
              }`}
            >
              {isGenerating ? 'Synthesizing...' : '🎬 Create 10s Video'}
            </button>
          </div>

          {speechError && (
            <div className="text-[11px] text-amber-400 font-mono bg-amber-950/40 border border-amber-900/60 rounded-lg px-2.5 py-1 text-left">
              {speechError}
            </div>
          )}
        </div>

        {/* Idea Sparks Chips */}
        <div className="space-y-2 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Or Click a Starter Idea to Test on the Spot:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_IDEA_SPARKS.map((spark, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSparkClick(spark.text)}
                disabled={isGenerating}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950 border border-slate-800 hover:border-cyan-600/80 transition-all text-left group cursor-pointer"
              >
                <span className="text-base">{spark.icon}</span>
                <span className="text-xs text-slate-300 group-hover:text-cyan-200 truncate">
                  {spark.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
