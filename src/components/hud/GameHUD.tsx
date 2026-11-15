import React from 'react';
import { TopNav } from './TopNav';
import { LandingHero } from './LandingHero';
import { CinematicVideoOverlay } from './CinematicVideoOverlay';
import { GenerationLogs } from './GenerationLogs';
import { LoadingOverlay } from '../feedback/LoadingOverlay';
import { ErrorOverlay } from '../feedback/ErrorOverlay';
import { useDreamStore } from '../../store/useDreamStore';

export const GameHUD: React.FC = () => {
  const world = useDreamStore((state) => state.world);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0 z-20 select-none">
      {/* Top Header Navigation (Shown on landing; Video showcase mode has its own sleek cinema header) */}
      {!world && <TopNav />}

      {/* When NO world is loaded: Show the Center Landing Hero Video Studio */}
      {!world && <LandingHero />}

      {/* When world IS loaded: Show 10-Second Cinematic Video Showcase Overlay */}
      {world && <CinematicVideoOverlay />}

      {/* Discretely placed Telemetry Feed (Top-Left) */}
      <div className="absolute top-20 left-6 pointer-events-auto opacity-40 hover:opacity-100 transition-opacity max-w-xs hidden lg:block">
        <GenerationLogs />
      </div>

      {/* State Overlays */}
      <LoadingOverlay />
      <ErrorOverlay />
    </div>
  );
};
