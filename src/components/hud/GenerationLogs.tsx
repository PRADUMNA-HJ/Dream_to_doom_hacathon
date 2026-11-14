import React, { useRef, useEffect } from 'react';
import { useDreamStore } from '../../store/useDreamStore';

export const GenerationLogs: React.FC = () => {
  const telemetryLogs = useDreamStore((state) => state.telemetryLogs);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [telemetryLogs]);

  if (telemetryLogs.length === 0) return null;

  return (
    <div className="w-full max-w-lg bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-800/80 p-3.5 shadow-2xl space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pipeline Telemetry Log
          </span>
        </div>
        <span className="text-[10px] text-slate-500">{telemetryLogs.length} events</span>
      </div>

      <div
        ref={containerRef}
        className="max-h-36 overflow-y-auto space-y-1.5 text-xs text-slate-300 pr-1 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {telemetryLogs.map((log) => {
          const date = new Date(log.timestamp);
          const timeFormatted = `${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;

          return (
            <div key={log.id} className="flex items-start gap-2 text-[11px] leading-tight">
              <span className="text-cyan-400 select-none shrink-0 font-semibold">
                [{timeFormatted}]
              </span>
              <span className="text-slate-300">
                <strong className="text-indigo-300">{log.stage}:</strong> {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
