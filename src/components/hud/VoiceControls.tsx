import React, { useState } from 'react';
import { useSpeechInput } from '../../sensory/useSpeechInput';
import { generateWorldFromTranscript } from '../../services/worldGenerationController';
import { useDreamStore } from '../../store/useDreamStore';
import { soundEngine } from '../../sensory/SoundEngine';

export const VoiceControls: React.FC = () => {
  const { transcript, isListening, speechError, isSupported, toggleListening, setTranscript, clearTranscript } =
    useSpeechInput();
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

    // Ensure audio engine initializes on this user action if not already
    if (!isAudioInitialized) {
      soundEngine.initAudio();
    }

    setTranscript(promptToSend);
    await generateWorldFromTranscript(promptToSend);
    setTypedInput('');
  };

  const demoPresets = [
    { label: '🌿 Enchanted Forest', prompt: 'Create an enchanted forest with giant glowing trees, floating crystals, mysterious portals, and soft mist.' },
    { label: '🏙️ Cyberpunk Rooftop', prompt: 'Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots.' },
    { label: '☁️ Floating Islands', prompt: 'Create an ethereal world with floating islands, glowing clouds, crystal structures, and a golden portal.' },
  ];

  return (
    <div className="bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-2xl max-w-xl w-full space-y-3.5">
      {/* Speech input & Mic trigger */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSupported || isGenerating}
          className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all duration-300 cursor-pointer ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#f43f5e]'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
          } ${(!isSupported || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSupported ? (isListening ? 'Click to stop listening' : 'Click to speak world prompt') : 'Web Speech API unavailable in this browser'}
        >
          {isListening ? (
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
            </span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 02-3-3V5a3 3 0 116 0v6a3 3 0 02-3 3z" />
            </svg>
          )}
        </button>

        {/* Text Input Fallback */}
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
            placeholder={isListening ? 'Listening to your microphone...' : 'Speak or type: "A glowing crystal cave..."'}
            disabled={isGenerating}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
          />
          {(typedInput || transcript) && (
            <button
              onClick={() => {
                setTypedInput('');
                clearTranscript();
              }}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
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
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
            isGenerating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {isGenerating ? 'Synthesizing...' : 'Generate'}
        </button>
      </div>

      {/* Speech error notice if any */}
      {speechError && (
        <div className="text-[11px] text-amber-400 font-mono bg-amber-950/40 border border-amber-900/60 rounded-lg px-2.5 py-1">
          {speechError}
        </div>
      )}

      {/* Demo preset prompt quick pills */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">
          Demo Presets:
        </span>
        {demoPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleGenerate(preset.prompt)}
            disabled={isGenerating}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-700 transition-all cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};
