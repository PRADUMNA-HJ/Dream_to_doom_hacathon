import React, { useState } from 'react';
import { useDreamStore } from '../../store/useDreamStore';
import { StatusBadge } from '../feedback/StatusBadge';
import { generateWorldFromTranscript } from '../../services/worldGenerationController';

export const IntegrationSurface: React.FC = () => {
  const [localInput, setLocalInput] = useState('');
  const transcript = useDreamStore((state) => state.transcript);
  const setTranscript = useDreamStore((state) => state.setTranscript);
  const generationStatus = useDreamStore((state) => state.generationStatus);
  const generationError = useDreamStore((state) => state.generationError);
  const world = useDreamStore((state) => state.world);
  const activeEvents = useDreamStore((state) => state.activeEvents);
  const resetSession = useDreamStore((state) => state.resetSession);

  const handleTestGenerate = async (useDevMock: boolean) => {
    const promptToUse = localInput || transcript || 'A mystical floating island with luminous crystals';
    setTranscript(promptToUse);
    await generateWorldFromTranscript(promptToUse, { useDevMock });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Status & Diagnostics Panel */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-300">Generation Status:</span>
            <StatusBadge status={generationStatus} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestGenerate(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              Load Test Mock World
            </button>
            <button
              onClick={() => handleTestGenerate(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Test Serverless Endpoint
            </button>
            <button
              onClick={resetSession}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer"
            >
              Reset Session
            </button>
          </div>
        </div>

        {generationError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 font-mono">
            <strong>Error:</strong> {generationError}
          </div>
        )}
      </section>

      {/* Grid: 3D Viewport placeholder & Sensory Input placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Person 2 Domain: 3D Canvas integration area */}
        <section className="lg:col-span-2 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl min-h-[460px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Person 2 Domain: src/world3d/
            </span>
          </div>

          {world ? (
            <div className="space-y-4 max-w-md text-left bg-slate-950/80 p-6 rounded-xl border border-slate-800 w-full">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">{world.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  {world.biome}
                </span>
              </div>
              <p className="text-xs text-slate-400">{world.description}</p>
              <div className="text-xs font-mono text-slate-400 space-y-1 border-t border-slate-800 pt-3">
                <p>Sky: <span style={{ color: world.environment.skyColor }}>{world.environment.skyColor}</span> | Ground: <span style={{ color: world.environment.groundColor }}>{world.environment.groundColor}</span></p>
                <p>Entities to spawn: <strong className="text-white">{world.entities.length}</strong></p>
                <p>Spawn Point: [{world.spawnPoint.x}, {world.spawnPoint.y}, {world.spawnPoint.z}]</p>
                <p>Audio Mood: <strong className="text-indigo-400">{world.audioMood}</strong></p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-xl font-mono">
                3D
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                React Three Fiber &lt;Canvas&gt; Mount Area
              </h3>
              <p className="text-xs text-slate-400">
                Awaiting Person 2 component: <code className="text-cyan-300">src/world3d/SceneContainer.tsx</code>.
                When active, preloaded GLTF primitives and Rapier colliders will render dynamically here.
              </p>
            </div>
          )}
        </section>

        {/* Person 3 Domain: Sensory & Input integration area */}
        <section className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                Person 3 Domain: src/sensory/
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Voice Transcript Stream (Web Speech API)
                </label>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 min-h-[72px] text-xs font-mono text-slate-300">
                  {transcript || <span className="text-slate-600 italic">No voice input captured yet...</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Simulate Speech / Manual Prompt:
                </label>
                <input
                  type="text"
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="e.g. A neon castle in cosmic void with platforms"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Tone.js Sound Engine Status</p>
                <p>Audio Mood: <code className="text-amber-400">{world?.audioMood ?? 'idle'}</code></p>
                <p>Weather SFX: <code className="text-amber-400">{world?.weather.type ?? 'none'}</code></p>
              </div>
            </div>
          </div>

          {/* Event Stream Viewer */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Non-Destructive Event Stream ({activeEvents.length})
            </h4>
            <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
              {activeEvents.length === 0 ? (
                <p className="text-slate-600 italic">No events emitted yet.</p>
              ) : (
                activeEvents.map((evt) => (
                  <div key={evt.id} className="text-slate-400 truncate">
                    <span className="text-indigo-400">[{evt.type}]</span> {JSON.stringify(evt.payload ?? {})}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
