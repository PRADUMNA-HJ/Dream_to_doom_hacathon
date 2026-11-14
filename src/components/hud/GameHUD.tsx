import React from 'react';
import { TopNav } from './TopNav';
import { VoiceControls } from './VoiceControls';
import { WorldStatusPanel } from './WorldStatusPanel';
import { GenerationLogs } from './GenerationLogs';
import { LoadingOverlay } from '../feedback/LoadingOverlay';
import { ErrorOverlay } from '../feedback/ErrorOverlay';
import { useDreamStore } from '../../store/useDreamStore';

export const GameHUD: React.FC = () => {
  const world = useDreamStore((state) => state.world);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0 z-20 select-none">
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
    </div>
  );
};
