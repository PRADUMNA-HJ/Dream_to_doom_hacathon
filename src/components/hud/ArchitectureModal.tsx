import React, { useState, useEffect } from 'react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'vs-mesh' | 'collision' | 'team'>('pipeline');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
              📐
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Why Scene Graph Generation?
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Architecture Blueprint • Zero-Backend Client Assembly • Sub-3s Latency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          {[
            { id: 'pipeline', label: '⚡ Voice-to-World Pipeline' },
            { id: 'vs-mesh', label: '🎯 Scene Graph vs 3D Diffusion' },
            { id: 'collision', label: '🛡️ Collision & Grid Hashing' },
            { id: 'team', label: '👥 Team Contracts & Stack' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs text-slate-300">
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">01.</span> End-to-End Voice-to-World Pipeline
              </h3>
              <p className="text-slate-300 leading-relaxed">
                The core innovation of Dream-to-Doom is zero-backend real-time generation. Instead of generating heavy 3D files on a server, we generate semantic placement contracts and assemble the world instantly in the client browser:
              </p>

              {/* Exact Architecture Flow Diagram */}
              <div className="bg-slate-950 p-3 rounded-xl border border-cyan-900/60 font-mono text-[11px] text-cyan-300 flex items-center justify-between flex-wrap gap-1">
                <span>User Prompt</span>
                <span className="text-slate-500">→</span>
                <span>Gemini Flash</span>
                <span className="text-slate-500">→</span>
                <span>Scene Graph JSON</span>
                <span className="text-slate-500">→</span>
                <span>Validation</span>
                <span className="text-slate-500">→</span>
                <span>Asset Registry</span>
                <span className="text-slate-500">→</span>
                <span>R3F Renderer</span>
                <span className="text-slate-500">→</span>
                <span className="text-emerald-400 font-bold">Playable World</span>
              </div>

              {/* Step Sequence Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">1. Voice Transcription</div>
                  <p className="text-[11px] text-slate-400">
                    Microphone stream processed locally in browser via <code className="text-cyan-300">Web Speech API (SpeechRecognition)</code> with interim streaming and silence debounce.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">2. Serverless Edge Gateway</div>
                  <p className="text-[11px] text-slate-400">
                    Transcript dispatched to stateless <code className="text-cyan-300">/api/generate-world</code> on Vercel Edge. Protects Gemini API keys with zero persistent database latency.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">3. Gemini Structured Output</div>
                  <p className="text-[11px] text-slate-400">
                    <code className="text-cyan-300">gemini-1.5-flash / gemini-2.5-flash</code> with OpenAPI 3.0 strict JSON Schema enforces typed Scene Graph (sky, terrain, entities, mood).
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">4. Zod Schema Validation</div>
                  <p className="text-[11px] text-slate-400">
                    Client passes response through runtime <code className="text-cyan-300">WorldSceneSchema</code>, clamping scales [0.2, 5], bounding positions [-45, 45], and sanitizing asset IDs.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">5. Zustand State Propagation</div>
                  <p className="text-[11px] text-slate-400">
                    Single source of truth updates atomically, incrementing <code className="text-cyan-300">worldRevision</code> and firing lifecycle hooks for HUD telemetry without re-renders.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="font-mono text-cyan-400 font-bold text-[11px]">6. R3F + Rapier Physics + Tone.js</div>
                  <p className="text-[11px] text-slate-400">
                    Instantiates preloaded GLTF models or procedural fallback hulls with <code className="text-cyan-300">@react-three/rapier</code> colliders while <code className="text-cyan-300">Tone.js</code> synthesizes mood audio.
                  </p>
                </div>
              </div>

              {/* Illustrative JSON Schema Example */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-mono font-semibold text-slate-300">
                  Illustrative Scene Graph Contract (JSON Output):
                </div>
                <pre className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
{`{
  "id": "world-enchanted-101",
  "title": "Enchanted Forest",
  "biome": "enchanted_forest",
  "mood": "dream",
  "audioMood": "calm",
  "environment": { "skyColor": "#0b1d3a", "groundColor": "#1b4d3e", "fogDensity": 0.04 },
  "entities": [
    { "id": "e_tree_1", "asset": "tree", "position": { "x": 6.5, "y": 0, "z": -8.0 }, "scale": { "x": 1.4, "y": 1.8, "z": 1.4 } },
    { "id": "e_crys_1", "asset": "crystal", "position": { "x": 0.0, "y": 1.0, "z": -4.5 }, "interaction": "collectible" },
    { "id": "e_port_1", "asset": "portal", "position": { "x": 12.0, "y": 0, "z": 10.0 }, "interaction": "portal" }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'vs-mesh' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">02.</span> Why Structured Scene Graph vs 3D Mesh Diffusion?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Judges frequently ask: <em className="text-indigo-300">"Why didn't you use Point-E, Shap-E, or TripoSR to generate 3D meshes with AI directly?"</em> Here is our production-conscious architectural reasoning:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-800 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-mono text-[11px]">
                      <th className="p-2.5">Evaluation Metric</th>
                      <th className="p-2.5 text-rose-400">Raw AI 3D Mesh Diffusion</th>
                      <th className="p-2.5 text-emerald-400">Dream-to-Doom Scene Graph (Our Approach)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                    <tr className="bg-slate-900/40">
                      <td className="p-2.5 font-semibold text-slate-300">Generation Latency</td>
                      <td className="p-2.5 text-rose-300">30 to 120 seconds per model (Unacceptable in live games)</td>
                      <td className="p-2.5 text-emerald-300 font-bold">1.5 to 3.0 seconds total (Sub-second on cached prompts)</td>
                    </tr>
                    <tr className="bg-slate-900/20">
                      <td className="p-2.5 font-semibold text-slate-300">Collision & Physics</td>
                      <td className="p-2.5 text-rose-300">None. Produces unclosed, non-manifold meshes requiring heavy client convex decomposition.</td>
                      <td className="p-2.5 text-emerald-300">Instant Rapier physics hulls (cuboid, ball, hull) tailored to asset taxonomy.</td>
                    </tr>
                    <tr className="bg-slate-900/40">
                      <td className="p-2.5 font-semibold text-slate-300">Rendering & Polycount</td>
                      <td className="p-2.5 text-rose-300">50,000 - 300,000 raw vertices; causes severe browser WebGL FPS drops.</td>
                      <td className="p-2.5 text-emerald-300">Pre-optimized low-poly assets (&lt; 2,000 polys) maintaining 60 FPS.</td>
                    </tr>
                    <tr className="bg-slate-900/20">
                      <td className="p-2.5 font-semibold text-slate-300">Network Bandwidth</td>
                      <td className="p-2.5 text-rose-300">10MB to 50MB binary payloads per generated asset.</td>
                      <td className="p-2.5 text-emerald-300">&lt; 2KB JSON Scene Graph transmitted over edge network.</td>
                    </tr>
                    <tr className="bg-slate-900/40">
                      <td className="p-2.5 font-semibold text-slate-300">Audio & Gameplay Context</td>
                      <td className="p-2.5 text-rose-300">Pure visual geometry without semantic tags or audio moods.</td>
                      <td className="p-2.5 text-emerald-300">Rich semantic metadata (mood, scale, collectible tags, danger attributes).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'collision' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">03.</span> Collision Avoidance & Procedural Density Hashing
              </h3>
              <p className="text-slate-300 leading-relaxed">
                When generating arbitrary entity positions from natural language, AI models can hallucinate overlapping coordinates or place objects inside the player spawn. We solve this via a multi-tiered spatial constraint system:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-cyan-400 font-mono font-bold text-[11px] mb-1">1. Player Safe Zone</div>
                  <p className="text-[11px] text-slate-400">
                    A cylinder of radius <code className="text-cyan-300">r = 3.5m</code> around <code className="text-cyan-300">[0, 0, 0]</code> is strictly reserved. Any entity landing inside is pushed outwards along its normalized vector.
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-cyan-400 font-mono font-bold text-[11px] mb-1">2. Spatial Density Grid</div>
                  <p className="text-[11px] text-slate-400">
                    The 100m² terrain is segmented into 10m² cells. A spatial hash map prevents more than 3 entities per cell, ensuring open movement paths.
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-cyan-400 font-mono font-bold text-[11px] mb-1">3. Damage Cooldowns</div>
                  <p className="text-[11px] text-slate-400">
                    Hazard damage is rate-limited to 1 hit per <code className="text-cyan-300">1200ms</code> per entity via timestamp refs, preventing multi-frame physics collision ticks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">04.</span> Team Modular Contracts & Stack
              </h3>
              <p className="text-slate-300 leading-relaxed">
                To prevent Git merge conflicts in a 24-hour sprint, work was strictly partitioned by domain interfaces rather than traditional frontend/backend:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Person 1 — Integrator & AI Lead</span>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">Completed & Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Architecture contracts, Vercel Serverless Function, Gemini 1.5/2.5 Flash SDK integration, Zod Scene Graph schemas, Zustand global store, Tailwind HUD & telemetry.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Person 2 — 3D & Graphics Lead</span>
                    <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800">Fully Integrated</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    React Three Fiber canvas, Rapier rigid bodies, Kinematic character controller, GLTF asset loading with procedural geometry fallbacks for all 10 assets.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Person 3 — Sensory & Audio Lead</span>
                    <span className="text-[10px] font-mono text-fuchsia-400 px-2 py-0.5 rounded bg-fuchsia-950 border border-fuchsia-800">Fully Integrated</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Web Speech API microphone management, Tone.js polyphonic sound synthesis, mood-adaptive musical scales (Dream = Major Pentatonic, Doom = Minor Diminished), and decoupled event bus.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 font-mono">
          <span>Dream-to-Doom • 24h Hackathon Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer shadow"
          >
            Return to World
          </button>
        </div>
      </div>
    </div>
  );
};

