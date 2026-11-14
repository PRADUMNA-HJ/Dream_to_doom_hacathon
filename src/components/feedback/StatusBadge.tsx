import React from 'react';
import type { GenerationStatus } from '../../store/useDreamStore';

interface StatusBadgeProps {
  status: GenerationStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'idle':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'generating':
        return 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse';
      case 'validating':
        return 'bg-purple-950 text-purple-300 border-purple-800 animate-pulse';
      case 'success':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'error':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${getBadgeStyle()}`}
    >
      {status}
    </span>
  );
};
