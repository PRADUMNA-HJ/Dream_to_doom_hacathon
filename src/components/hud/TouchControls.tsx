import React from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const TouchControls: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const isGameStarted = useDreamStore((state) => state.isGameStarted);

  if (!world || !isGameStarted) return null;

  const triggerKey = (code: string, isDown: boolean) => {
    const eventType = isDown ? 'keydown' : 'keyup';
    window.dispatchEvent(new KeyboardEvent(eventType, { code, bubbles: true }));
  };

  return (
    <div className="md:hidden fixed bottom-24 right-4 z-30 pointer-events-auto flex items-end gap-3 select-none">
      {/* Directional Pad */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        <div />
        <button
          type="button"
          onTouchStart={() => triggerKey('KeyW', true)}
          onTouchEnd={() => triggerKey('KeyW', false)}
          onMouseDown={() => triggerKey('KeyW', true)}
          onMouseUp={() => triggerKey('KeyW', false)}
          className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow transition"
          aria-label="Move Forward"
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          onTouchStart={() => triggerKey('KeyA', true)}
          onTouchEnd={() => triggerKey('KeyA', false)}
          onMouseDown={() => triggerKey('KeyA', true)}
          onMouseUp={() => triggerKey('KeyA', false)}
          className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow transition"
          aria-label="Move Left"
        >
          ◀
        </button>
        <button
          type="button"
          onTouchStart={() => triggerKey('KeyS', true)}
          onTouchEnd={() => triggerKey('KeyS', false)}
          onMouseDown={() => triggerKey('KeyS', true)}
          onMouseUp={() => triggerKey('KeyS', false)}
          className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow transition"
          aria-label="Move Backward"
        >
          ▼
        </button>
        <button
          type="button"
          onTouchStart={() => triggerKey('KeyD', true)}
          onTouchEnd={() => triggerKey('KeyD', false)}
          onMouseDown={() => triggerKey('KeyD', true)}
          onMouseUp={() => triggerKey('KeyD', false)}
          className="w-10 h-10 rounded-xl bg-slate-800 active:bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow transition"
          aria-label="Move Right"
        >
          ▶
        </button>
      </div>

      {/* Jump Button */}
      <button
        type="button"
        onTouchStart={() => triggerKey('Space', true)}
        onTouchEnd={() => triggerKey('Space', false)}
        onMouseDown={() => triggerKey('Space', true)}
        onMouseUp={() => triggerKey('Space', false)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 active:from-cyan-400 active:to-indigo-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center shadow-2xl border border-cyan-400/40"
        aria-label="Jump"
      >
        JUMP
      </button>
    </div>
  );
};
