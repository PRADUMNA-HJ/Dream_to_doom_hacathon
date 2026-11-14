import React, { useEffect } from 'react';
import { SceneContainer } from '../world3d/SceneContainer';
import { GameHUD } from '../components/hud/GameHUD';
import { eventBus } from '../shared/events/eventBus';
import { soundEngine } from '../sensory/SoundEngine';
import { useDreamStore } from '../store/useDreamStore';
import { useGameAudioEvents } from '../sensory/hooks/useGameAudioEvents';

export const GameOrchestrator: React.FC = () => {
  const audioMood = useDreamStore((state) => state.world?.audioMood);
  const activeEvents = useDreamStore((state) => state.activeEvents);

  // 1. Wire Person 3's procedural game audio events to activeEvents stream
  useGameAudioEvents(activeEvents);

  // 2. Synchronize audio mood when a new world is generated
  useEffect(() => {
    if (audioMood) {
      soundEngine.applyAudioMood(audioMood);
    }
  }, [audioMood]);

  // 3. Wire the game event bus to the sound engine SFX
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('*', (event) => {
      soundEngine.playEventSfx(event.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D World Canvas (Background Viewport) */}
      <div className="absolute inset-0 z-0">
        <SceneContainer />
      </div>

      {/* Futuristic HUD Overlay (Foreground Layer) */}
      <GameHUD />
    </div>
  );
};
