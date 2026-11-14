/// <reference path="../types/react-ambient.d.ts" />
/// <reference path="../types/tone-ambient.d.ts" />
/**
 * Dream-to-Doom: Sensory Domain — Audio Controls HUD Component
 * Standalone cyberpunk HUD console providing master bus volume/mute management,
 * independent ambient soundscape synthesis & preset selection, and procedural SFX preview.
 */

import React, { useState, useCallback, useEffect, useId } from 'react';
import {
  initializeAudio,
  setVolume,
  getVolume,
  muteAudio,
  unmuteAudio,
  isAudioInitialized,
  getAudioStatus,
  setMasterVolume,
  getMasterVolume,
  muteMasterAudio,
  unmuteMasterAudio,
  getMasterAudioStatus,
} from '../audio/audioManager';
import {
  startAmbientAudio,
  stopAmbientAudio,
  changeAmbientPreset,
  setAmbientVolume,
  getAmbientStatus,
} from '../audio/ambientAudio';
import {
  initializeSoundEffects,
  playSoundEffect,
  setSoundEffectsVolume,
  muteSoundEffects,
  unmuteSoundEffects,
  getSoundEffectsStatus,
} from '../audio/soundEffects';
import type {
  AmbientPresetType,
  AudioEngineStatus,
  GameAudioEventType,
} from '../types/audio.types';
import { GAME_AUDIO_EVENTS_META } from '../utils/audioConfig';

// ============================================================================
// Component Props Interface
// ============================================================================

export interface AudioControlsProps {
  /** Optional custom container CSS classes */
  className?: string;
  /** Optional initial ambient soundscape preset (defaults to 'ethereal_drone') */
  initialAmbientPreset?: AmbientPresetType;
  /** Whether to render the SFX preview test triggers (defaults to true) */
  showSfxPreview?: boolean;
  /** Callback fired whenever audio status transitions */
  onStatusChange?: (status: {
    isInitialized: boolean;
    isMuted: boolean;
    masterVolume: number;
    ambientPlaying: boolean;
    activeAmbientPreset: AmbientPresetType | null;
  }) => void;
}

// Preset display metadata
const AMBIENT_PRESET_OPTIONS: readonly { id: AmbientPresetType; label: string; icon: string }[] = [
  { id: 'ethereal_drone', label: 'Ethereal Drone', icon: '🌌' },
  { id: 'dystopian_drone', label: 'Dystopian Drone', icon: '🏭' },
  { id: 'cyber_ambience', label: 'Cyber Ambience', icon: '⚡' },
  { id: 'nature_breeze', label: 'Nature Breeze', icon: '🍃' },
  { id: 'volcanic_rumble', label: 'Volcanic Rumble', icon: '🌋' },
  { id: 'void_silence', label: 'Void Silence', icon: '🔇' },
] as const;

// ============================================================================
// Reusable Inline SVG Icons (Zero Dependencies)
// ============================================================================

const VolumeHighIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VolumeMuteIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </svg>
);

const PowerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" x2="12" y1="2" y2="12" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

// ============================================================================
// Main Component: AudioControls
// ============================================================================

export const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  initialAmbientPreset = 'ethereal_drone' as AmbientPresetType,
  showSfxPreview = true,
  onStatusChange,
}: AudioControlsProps) => {
  // Master state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [engineStatus, setEngineStatus] = useState<AudioEngineStatus>('uninitialized');
  const [masterVol, setMasterVol] = useState<number>(0.75);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Ambient state
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(false);
  const [ambientPreset, setAmbientPreset] = useState<AmbientPresetType>(initialAmbientPreset);
  const [ambientVol, setAmbientVol] = useState<number>(0.8);

  // SFX state
  const [sfxVol, setSfxVol] = useState<number>(0.75);
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(false);
  const [selectedPreviewEvent, setSelectedPreviewEvent] = useState<GameAudioEventType>('object_spawned');
  const [recentPlayedEvent, setRecentPlayedEvent] = useState<string | null>(null);

  // Accessible IDs
  const masterSliderId = useId();
  const ambientSliderId = useId();
  const sfxSliderId = useId();
  const presetSelectId = useId();
  const sfxSelectId = useId();

  // Sync internal state with underlying singleton engines
  const syncTelemetry = useCallback(() => {
    const initialized = isAudioInitialized();
    setIsInitialized(initialized);

    const masterStatus = getMasterAudioStatus();
    setEngineStatus(masterStatus.engineStatus);
    setMasterVol(masterStatus.volume);
    setIsMasterMuted(masterStatus.isMuted);

    const ambientStatus = getAmbientStatus();
    setAmbientPlaying(ambientStatus.isPlaying);
    if (ambientStatus.activePreset) {
      setAmbientPreset(ambientStatus.activePreset);
    }
    setAmbientVol(ambientStatus.volume);

    const sfxStatus = getSoundEffectsStatus();
    setSfxVol(sfxStatus.volume);
    setIsSfxMuted(sfxStatus.isMuted);

    onStatusChange?.({
      isInitialized: initialized,
      isMuted: masterStatus.isMuted,
      masterVolume: masterStatus.volume,
      ambientPlaying: ambientStatus.isPlaying,
      activeAmbientPreset: ambientStatus.activePreset,
    });
  }, [onStatusChange]);

  useEffect(() => {
    syncTelemetry();
  }, [syncTelemetry]);

  // --------------------------------------------------------------------------
  // User Gesture: Explicit Audio Initialization
  // --------------------------------------------------------------------------
  const handleInitializeAudio = useCallback(async () => {
    setInitError(null);
    try {
      const success = await initializeAudio();
      if (success) {
        // Initialize SFX pool on same user gesture
        await initializeSoundEffects();
        syncTelemetry();
      } else {
        setInitError('Audio blocked: User interaction required by browser autoplay policy.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setInitError(`Initialization failed: ${msg}`);
    }
  }, [syncTelemetry]);

  // --------------------------------------------------------------------------
  // Master Bus Handlers
  // --------------------------------------------------------------------------
  const handleMasterVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setMasterVol(val);
      setMasterVolume(val);
      syncTelemetry();
    },
    [syncTelemetry]
  );

  const handleToggleMasterMute = useCallback(() => {
    if (isMasterMuted) {
      unmuteMasterAudio();
    } else {
      muteMasterAudio();
    }
    syncTelemetry();
  }, [isMasterMuted, syncTelemetry]);

  // --------------------------------------------------------------------------
  // Ambient Soundscape Handlers
  // --------------------------------------------------------------------------
  const handleToggleAmbient = useCallback(async () => {
    if (!isInitialized) {
      await handleInitializeAudio();
    }

    if (ambientPlaying) {
      stopAmbientAudio();
    } else {
      await startAmbientAudio(ambientPreset);
    }
    syncTelemetry();
  }, [ambientPlaying, ambientPreset, handleInitializeAudio, isInitialized, syncTelemetry]);

  const handleAmbientPresetChange = useCallback(
    async (preset: AmbientPresetType) => {
      setAmbientPreset(preset);
      if (ambientPlaying) {
        await changeAmbientPreset(preset);
      }
      syncTelemetry();
    },
    [ambientPlaying, syncTelemetry]
  );

  const handleAmbientVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setAmbientVol(val);
      setAmbientVolume(val);
      syncTelemetry();
    },
    [syncTelemetry]
  );

  // --------------------------------------------------------------------------
  // SFX Handlers
  // --------------------------------------------------------------------------
  const handleSfxVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setSfxVol(val);
      setSoundEffectsVolume(val);
      syncTelemetry();
    },
    [syncTelemetry]
  );

  const handleToggleSfxMute = useCallback(() => {
    if (isSfxMuted) {
      unmuteSoundEffects();
    } else {
      muteSoundEffects();
    }
    syncTelemetry();
  }, [isSfxMuted, syncTelemetry]);

  const handlePreviewSfx = useCallback(async () => {
    if (!isInitialized) {
      await handleInitializeAudio();
    }
    playSoundEffect(selectedPreviewEvent);
    setRecentPlayedEvent(selectedPreviewEvent);
    syncTelemetry();
    setTimeout(() => setRecentPlayedEvent(null), 600);
  }, [handleInitializeAudio, isInitialized, selectedPreviewEvent, syncTelemetry]);

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] backdrop-blur-xl p-5 md:p-6 text-slate-100 font-sans transition-all duration-300 ${className}`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Header: Title, Telemetry Badge, and Master Initialize Button         */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <h2 className="text-sm md:text-base font-bold tracking-wider uppercase text-cyan-300">
            Sensory Audio Console
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider border ${
              isInitialized
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/60 animate-pulse'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isInitialized ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isInitialized ? 'AUDIO ACTIVE' : 'AWAITING GESTURE'}</span>
          </span>

          {/* Master Initialize Button */}
          {!isInitialized && (
            <button
              type="button"
              onClick={handleInitializeAudio}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
            >
              <PowerIcon className="w-3.5 h-3.5" />
              <span>Enable Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Autoplay Error Notice */}
      {initError && (
        <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
          <span>{initError}</span>
          <button
            type="button"
            onClick={handleInitializeAudio}
            className="text-cyan-300 underline font-semibold hover:text-cyan-200 ml-2 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Uninitialized Guidance Banner */}
      {!isInitialized && !initError && (
        <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs flex items-center justify-between">
          <span>Web Audio context requires an explicit click to activate.</span>
          <button
            type="button"
            onClick={handleInitializeAudio}
            className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-slate-100 font-semibold transition ml-2 cursor-pointer"
          >
            Activate Now
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 1. Master Audio Section                                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <VolumeHighIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Master Output Bus
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-300 font-bold">
              {isMasterMuted ? 'MUTED' : `${Math.round(masterVol * 100)}%`}
            </span>
            <button
              type="button"
              onClick={handleToggleMasterMute}
              disabled={!isInitialized}
              className={`p-1.5 rounded-lg border transition cursor-pointer disabled:cursor-not-allowed ${
                isMasterMuted
                  ? 'bg-red-950/80 border-red-700/60 text-red-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-cyan-300'
              }`}
              title={isMasterMuted ? 'Unmute Master Output' : 'Mute Master Output'}
              aria-label={isMasterMuted ? 'Unmute Master Output' : 'Mute Master Output'}
            >
              {isMasterMuted ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeHighIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Master Slider */}
        <label htmlFor={masterSliderId} className="sr-only">
          Master Volume Slider
        </label>
        <input
          id={masterSliderId}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVol}
          onChange={handleMasterVolumeChange}
          disabled={!isInitialized}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
        />

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Limiter: -0.5 dB</span>
          <span>Compressor: -18 dB (4:1)</span>
          <span className="capitalize text-slate-400">Status: {engineStatus}</span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Ambient Soundscape Section                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="mt-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🌌</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Procedural Ambient Soundscape
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-purple-300 font-bold">
              {`${Math.round(ambientVol * 100)}%`}
            </span>
            <button
              type="button"
              onClick={handleToggleAmbient}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${
                ambientPlaying
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:bg-purple-900'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-purple-300 hover:border-purple-600/50'
              }`}
            >
              {ambientPlaying ? (
                <>
                  <PauseIcon className="w-3 h-3" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-3 h-3" />
                  <span>Play</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient Volume Slider */}
        <div className="mb-3">
          <label htmlFor={ambientSliderId} className="sr-only">
            Ambient Volume Slider
          </label>
          <input
            id={ambientSliderId}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ambientVol}
            onChange={handleAmbientVolumeChange}
            disabled={!isInitialized}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        {/* Preset Selector Grid */}
        <div>
          <label htmlFor={presetSelectId} className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
            Select Soundscape Atmosphere:
          </label>
          <div id={presetSelectId} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMBIENT_PRESET_OPTIONS.map((opt) => {
              const isSelected = ambientPreset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAmbientPresetChange(opt.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-950/60 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Sound Effects & Preview Section                                   */}
      {/* -------------------------------------------------------------------- */}
      {showSfxPreview && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm">💥</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Procedural Sound Effects
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {isSfxMuted ? 'MUTED' : `${Math.round(sfxVol * 100)}%`}
              </span>
              <button
                type="button"
                onClick={handleToggleSfxMute}
                disabled={!isInitialized}
                className={`p-1.5 rounded-lg border transition cursor-pointer disabled:cursor-not-allowed ${
                  isSfxMuted
                    ? 'bg-red-950/80 border-red-700/60 text-red-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-cyan-300'
                }`}
                title={isSfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
                aria-label={isSfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              >
                {isSfxMuted ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeHighIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SFX Volume Slider */}
          <div className="mb-3">
            <label htmlFor={sfxSliderId} className="sr-only">
              Sound Effects Volume Slider
            </label>
            <input
              id={sfxSliderId}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVol}
              onChange={handleSfxVolumeChange}
              disabled={!isInitialized}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Preview Trigger Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <label htmlFor={sfxSelectId} className="sr-only">
              Select Sound Effect to Preview
            </label>
            <select
              id={sfxSelectId}
              value={selectedPreviewEvent}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedPreviewEvent(e.target.value as GameAudioEventType)
              }
              className="flex-1 text-xs bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {GAME_AUDIO_EVENTS_META.map((meta) => (
                <option key={meta.type} value={meta.type} className="bg-slate-950 text-slate-200">
                  {meta.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePreviewSfx}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
                recentPlayedEvent === selectedPreviewEvent
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95'
              }`}
            >
              <PlayIcon className="w-3 h-3" />
              <span>Preview SFX</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <p className="mt-4 text-[10px] text-center text-slate-500">
        Dream-to-Doom Audio Core • Centralized Master Compressor & Limiter Bus
      </p>
    </div>
  );
};

export default AudioControls;

