/// <reference path="../types/react-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Voice Controller Component
 * Standalone cyberpunk HUD voice terminal providing real-time speech recognition,
 * animated audio wave visualization, language switching (en-US / ta-IN),
 * confidence scoring, permission guidance, and manual text fallback.
 */

import React, { useState, useCallback, useId, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type SpeechRecognitionStatus,
  type PromptSubmissionPayload,
} from '../types/speech.types';

// ============================================================================
// Component Props Interface
// ============================================================================

export interface VoiceControllerProps {
  /** Callback fired whenever speech engine confirms a finalized transcript */
  onFinalTranscript?: (transcript: string) => void;
  /** Callback fired when user submits manual text prompt */
  onManualSubmit?: (text: string) => void;
  /** Unified callback providing distinguishable prompt submission payload with origin metadata */
  onSubmitPrompt?: (submission: PromptSubmissionPayload) => void;
  /** Optional initial speech recognition language (defaults to 'en-US') */
  initialLanguage?: SupportedLanguage;
  /** Whether to display the manual text input fallback panel (defaults to true) */
  showManualFallback?: boolean;
  /** Custom container CSS class overrides */
  className?: string;
}

// ============================================================================
// Helper UI Subcomponents & SVGs (Self-Contained & Dependency-Free)
// ============================================================================

const MicIcon: React.FC<{ isListening: boolean; className?: string }> = ({
  isListening,
  className = 'w-6 h-6',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
    {isListening && (
      <circle cx="12" cy="7" r="1.5" className="fill-red-500 stroke-none animate-ping" />
    )}
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const KeyboardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
  </svg>
);

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// Status Badge Helper
const getStatusBadge = (status: SpeechRecognitionStatus, isSupported: boolean) => {
  if (!isSupported) {
    return {
      text: 'UNSUPPORTED',
      badgeClass: 'bg-red-950/80 text-red-400 border-red-800/50',
      dotClass: 'bg-red-500',
    };
  }

  switch (status) {
    case 'listening':
      return {
        text: 'RECORDING',
        badgeClass: 'bg-red-950/80 text-red-300 border-red-700/60 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        dotClass: 'bg-red-500 animate-ping',
      };
    case 'processing':
      return {
        text: 'PROCESSING',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        dotClass: 'bg-amber-400 animate-pulse',
      };
    case 'starting':
      return {
        text: 'STARTING...',
        badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
        dotClass: 'bg-cyan-400 animate-pulse',
      };
    case 'error':
      return {
        text: 'ERROR',
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
        dotClass: 'bg-rose-500',
      };
    case 'stopped':
    case 'idle':
    default:
      return {
        text: 'READY',
        badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-700/50',
        dotClass: 'bg-slate-500',
      };
  }
};

// ============================================================================
// Main Component: VoiceController
// ============================================================================

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onFinalTranscript,
  onManualSubmit,
  onSubmitPrompt,
  initialLanguage = 'en-US' as SupportedLanguage,
  showManualFallback = true,
  className = '',
}: VoiceControllerProps) => {
  const [manualText, setManualText] = useState('');
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  const manualInputId = useId();
  const languageRef = useRef<SupportedLanguage | string>(initialLanguage);

  // Web Audio API Analyzer for real mic waveform visualization
  const [realAudioLevels, setRealAudioLevels] = useState<number[]>([25, 45, 70, 40, 65, 30, 50]);
  const [hasRealAudioStream, setHasRealAudioStream] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Transcript editing states
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');

  // Unified callback for voice transcript that dispatches distinguishable metadata
  const handleVoiceFinalTranscript = useCallback(
    (finalizedText: string) => {
      onFinalTranscript?.(finalizedText);
      onSubmitPrompt?.({
        text: finalizedText,
        source: 'voice',
        language: languageRef.current,
        timestamp: Date.now(),
      });
    },
    [onFinalTranscript, onSubmitPrompt]
  );

  // Internal Web Speech API hook
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    status,
    error,
    language,
    permissionStatus,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
    setLanguage,
  } = useSpeechRecognition({
    lang: initialLanguage,
    continuous: true,
    interimResults: true,
    onFinalTranscript: handleVoiceFinalTranscript,
  });

  // Keep active language ref updated for prompt provenance
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Keep editedTranscript in sync with incoming speech when not actively editing
  useEffect(() => {
    if (!isEditingTranscript) {
      setEditedTranscript(transcript);
    }
  }, [transcript, isEditingTranscript]);

  // Real-time microphone audio visualizer loop with full cleanup
  useEffect(() => {
    if (!isListening) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setHasRealAudioStream(false);
      return;
    }

    let isMounted = true;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          if (!isMounted || !isListening) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextClass) return;

          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateWaveform = () => {
            if (!isMounted) return;
            analyser.getByteFrequencyData(dataArray);

            const bands: number[] = [];
            const step = Math.max(1, Math.floor(bufferLength / 7));
            for (let i = 0; i < 7; i++) {
              const val = dataArray[i * step] || 0;
              const heightPct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
              bands.push(heightPct);
            }
            setRealAudioLevels(bands);
            setHasRealAudioStream(true);
            animFrameRef.current = requestAnimationFrame(updateWaveform);
          };

          updateWaveform();
        })
        .catch(() => {
          // Gracefully fall back to CSS pulse waveform if getUserMedia is denied or unavailable
          setHasRealAudioStream(false);
        });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isListening]);

  // Direct trigger to generate world from terminal
  const handleTriggerGenerate = useCallback(() => {
    const textToSubmit = isEditingTranscript
      ? editedTranscript.trim()
      : (editedTranscript || transcript).trim();
    if (!textToSubmit) return;

    if (isListening) {
      stopListening();
    }
    setIsEditingTranscript(false);

    onFinalTranscript?.(textToSubmit);
    onSubmitPrompt?.({
      text: textToSubmit,
      source: isEditingTranscript ? 'manual' : 'voice',
      language: languageRef.current,
      timestamp: Date.now(),
    });
  }, [editedTranscript, isEditingTranscript, isListening, onFinalTranscript, onSubmitPrompt, stopListening, transcript]);

  // Handle manual fallback submit with distinguishable source: 'manual'
  const handleManualSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = manualText.trim();
      if (!trimmed) return;

      onManualSubmit?.(trimmed);
      onSubmitPrompt?.({
        text: trimmed,
        source: 'manual',
        timestamp: Date.now(),
      });
      setManualText('');
    },
    [manualText, onManualSubmit, onSubmitPrompt]
  );

  // Toggle speech recording session
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const statusBadge = getStatusBadge(status, isSupported);
  const confidencePercent = confidence > 0 ? Math.round(confidence * 100) : null;
  const wordCount = transcript
    ? transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] backdrop-blur-xl p-5 md:p-6 text-slate-100 font-sans transition-all duration-300 ${className}`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Title, Language Selector, and Status Badge           */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <h2 className="text-sm md:text-base font-bold tracking-wider uppercase text-cyan-300">
            Sensory Input Terminal
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Selector Dropdown */}
          <label htmlFor="language-select" className="sr-only">
            Select Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLanguage(e.target.value as SupportedLanguage)
            }
            className="text-xs bg-slate-900/90 border border-cyan-700/50 rounded-lg px-2.5 py-1 text-cyan-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200">
                {lang.label} ({lang.nativeLabel})
              </option>
            ))}
          </select>

          {/* Engine Lifecycle Status Badge */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider border ${statusBadge.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
            <span>{statusBadge.text}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Interactive Voice Trigger & Sound Wave Visualization             */}
      {/* -------------------------------------------------------------------- */}
      <div className="my-6 flex flex-col items-center justify-center">
        {/* Glowing Concentric Microphone Action Button */}
        <div className="relative group">
          {/* Animated Glow Rings when Listening */}
          {isListening && (
            <>
              <div className="absolute -inset-3 rounded-full bg-cyan-500/20 blur-md animate-ping" />
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-red-500 to-cyan-500 opacity-75 blur-sm animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={handleToggleListening}
            disabled={!isSupported}
            aria-label={isListening ? 'Stop Voice Recording' : 'Start Voice Recording'}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 shadow-2xl focus:outline-none focus:ring-4 focus:ring-cyan-500/30 ${
              !isSupported
                ? 'bg-slate-900/50 border-slate-700/50 text-slate-600 cursor-not-allowed'
                : isListening
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95'
                : 'bg-slate-900/90 border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95'
            }`}
          >
            <MicIcon isListening={isListening} className="w-8 h-8" />
          </button>
        </div>

        {/* Action Button Label */}
        <p className="mt-3 text-xs md:text-sm font-medium tracking-wide text-slate-300">
          {isListening ? (
            <span className="text-red-400 font-semibold animate-pulse">
              Listening... Click to Finish Speech
            </span>
          ) : (
            <span className="text-slate-400">Click microphone to speak world prompt</span>
          )}
        </p>

        {/* Dynamic Microphone Waveform Analyzer Bars */}
        <div
          className={`flex items-center justify-center space-x-1.5 h-6 mt-3 transition-opacity duration-300 ${
            isListening ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
        >
          {realAudioLevels.map((height, idx) => (
            <span
              key={idx}
              style={{
                height: `${height}%`,
                transition: hasRealAudioStream ? 'height 0.08s ease' : undefined,
                animationDelay: !hasRealAudioStream ? `${idx * 0.12}s` : undefined,
                animationDuration: !hasRealAudioStream ? '0.8s' : undefined,
              }}
              className={`w-1 rounded-full ${
                hasRealAudioStream
                  ? 'bg-gradient-to-t from-cyan-400 to-indigo-400'
                  : 'bg-gradient-to-t from-cyan-500 to-red-400 animate-pulse'
              }`}
            />
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Live Speech Transcript Stream Display                             */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 min-h-[110px] flex flex-col justify-between">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Recognized Voice Stream</span>
          {transcript && (
            <button
              type="button"
              onClick={clearTranscript}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-red-400 transition text-[11px] px-2 py-0.5 rounded bg-slate-800/50 hover:bg-red-950/40"
              title="Clear current transcript"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Transcript Content Area */}
        <div className="text-sm md:text-base leading-relaxed break-words font-mono">
          {isEditingTranscript ? (
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              rows={2}
              className="w-full text-xs md:text-sm bg-slate-950 border border-cyan-500/60 rounded-lg p-2.5 text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono resize-none"
              placeholder="Edit recognized speech prompt..."
            />
          ) : (transcript || interimTranscript) ? (
            <p>
              <span className="text-slate-100 font-medium">{transcript}</span>
              {interimTranscript && (
                <span className="text-cyan-400 italic bg-cyan-950/40 px-1 py-0.5 rounded ml-1 animate-pulse">
                  {interimTranscript}
                </span>
              )}
            </p>
          ) : (
            <p className="text-slate-500 italic text-xs md:text-sm">
              &quot;Speak your imagination... e.g. &apos;A neon cyberpunk citadel surrounded by toxic
              purple fog and floating energy crystals&apos;&quot;
            </p>
          )}
        </div>

        {/* Action Controls for Transcript: Edit & Direct Generate */}
        {(transcript || editedTranscript) && (
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (!isEditingTranscript) {
                  setEditedTranscript(transcript);
                }
                setIsEditingTranscript(!isEditingTranscript);
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-sans transition cursor-pointer"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>{isEditingTranscript ? 'Done Editing' : 'Edit Transcript'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerGenerate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Generate World</span>
            </button>
          </div>
        )}

        {/* Telemetry Metrics Footer */}
        <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>Words: <strong className="text-slate-200">{wordCount}</strong></span>
            {confidencePercent !== null ? (
              <span>
                Confidence: <strong className="text-cyan-300">{confidencePercent}%</strong>
              </span>
            ) : (
              <span className="text-slate-500">Confidence: N/A</span>
            )}
          </div>

          <div className="text-slate-500 text-[10px]">
            Mic Permission: <span className="capitalize text-slate-400">{permissionStatus}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. Actionable Error Recovery Banner                                  */}
      {/* -------------------------------------------------------------------- */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-950/60 border border-red-500/40 p-3.5 flex items-start space-x-3 text-red-200 text-xs md:text-sm"
        >
          <AlertTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">{error.message}</p>
            {error.code === 'not-allowed' && (
              <p className="mt-1 text-red-400 text-xs">
                Tip: Click the microphone lock icon in your browser address bar to allow microphone
                permissions, then try again.
              </p>
            )}
            {error.code === 'unsupported-browser' && (
              <p className="mt-1 text-red-400 text-xs">
                Tip: Native speech recognition works in Google Chrome, Microsoft Edge, and Brave. You
                can also use the manual text fallback below.
              </p>
            )}
            {error.code === 'network' && (
              <p className="mt-1 text-red-400 text-xs">
                Tip: Check your internet connection. Browser speech engines rely on cloud
                connectivity.
              </p>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. Manual Text Fallback Area                                         */}
      {/* -------------------------------------------------------------------- */}
      {showManualFallback && (
        <div className="mt-5 pt-4 border-t border-cyan-900/30">
          <button
            type="button"
            onClick={() => setIsManualExpanded(!isManualExpanded)}
            className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <KeyboardIcon className="w-4 h-4" />
            <span>
              {isManualExpanded ? 'Hide Manual Text Fallback' : 'Manual Text Prompt Fallback'}
            </span>
          </button>

          {isManualExpanded && (
            <form onSubmit={handleManualSubmit} className="mt-3 space-y-2">
              <label htmlFor={manualInputId} className="sr-only">
                Manual World Prompt Input
              </label>
              <textarea
                id={manualInputId}
                rows={2}
                value={manualText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setManualText(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleManualSubmit();
                  }
                }}
                placeholder="Type your world description here (Press Enter to submit)..."
                className="w-full text-xs md:text-sm bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                >
                  Submit Prompt
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Footer Disclaimer */}
      <p className="mt-4 text-[10px] text-center text-slate-600">
        Dream-to-Doom Sensory Engine • Web Speech API • Non-guaranteed algorithmic confidence scoring
      </p>
    </div>
  );
};

export default VoiceController;

