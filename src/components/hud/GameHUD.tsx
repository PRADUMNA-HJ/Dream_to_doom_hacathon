import React, { useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { VoiceControls } from './VoiceControls';
import { WorldStatusPanel } from './WorldStatusPanel';
import { GenerationLogs } from './GenerationLogs';
import { LoadingOverlay } from '../feedback/LoadingOverlay';
import { ErrorOverlay } from '../feedback/ErrorOverlay';
import { GameOverOverlay } from '../feedback/GameOverOverlay';
import { useDreamStore } from '../../store/useDreamStore';
import { eventBus } from '../../shared/events/eventBus';

export const GameHUD: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const [isDamageFlash, setIsDamageFlash] = useState(false);
  const [isWarpFlash, setIsWarpFlash] = useState(false);

  useEffect(() => {
    const unsubDamage = eventBus.subscribe('player-damaged', () => {
      setIsDamageFlash(true);
      const timer = setTimeout(() => setIsDamageFlash(false), 450);
      return () => clearTimeout(timer);
    });

    const unsubPortal = eventBus.subscribe('portal-entered', () => {
      setIsWarpFlash(true);
      const timer = setTimeout(() => setIsWarpFlash(false), 650);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubDamage();
      unsubPortal();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0 z-20 select-none">
      {/* Visual Feedback: Hazard Damage Vignette Flash */}
      {isDamageFlash && (
        <div className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300 bg-rose-600/20 shadow-[inset_0_0_120px_rgba(225,29,72,0.6)] animate-pulse" />
      )}

      {/* Visual Feedback: Portal Teleportation Warp Flash */}
      {isWarpFlash && (
        <div className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500 bg-fuchsia-600/25 shadow-[inset_0_0_140px_rgba(217,70,239,0.7)]" />
      )}

      {/* Top Header Navigation */}
      <TopNav />

      {/* Main Mid-Section Overlay */}
      <div className="flex-1 flex justify-between items-start px-6 py-4 pointer-events-none gap-6 overflow-hidden">
        {/* Left Telemetry Feed */}
        <div className="pointer-events-auto flex flex-col gap-3">
          <GenerationLogs />
        </div>

        {/* Right Active World Status */}
        {world && (
          <div className="pointer-events-auto">
            <WorldStatusPanel />
          </div>
        )}
      </div>

      {/* Bottom Voice / Prompt Control Panel */}
      <div className="w-full flex flex-col items-center justify-center pb-6 px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl">
          <VoiceControls />
        </div>
      </div>

      {/* Standalone State Overlays */}
      <LoadingOverlay />
      <ErrorOverlay />
      <GameOverOverlay />
    </div>
  );
};
