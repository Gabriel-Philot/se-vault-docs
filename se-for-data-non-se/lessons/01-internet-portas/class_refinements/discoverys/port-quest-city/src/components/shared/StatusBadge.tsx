import React from 'react';
import { cn } from './GlassPanel';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'running':
      case 'delivered':
      case 'listen':
        return 'bg-pq-green/20 text-pq-green border-pq-green/30';
      case 'stopped':
      case 'blocked':
      case 'close_wait':
        return 'bg-pq-red/20 text-pq-red border-pq-red/30';
      case 'error':
      case 'dropped':
        return 'bg-pq-amber/20 text-pq-amber border-pq-amber/30';
      case 'traveling':
      case 'established':
        return 'bg-pq-blue/20 text-pq-blue border-pq-blue/30';
      case 'time_wait':
        return 'bg-pq-yellow/20 text-pq-yellow border-pq-yellow/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border',
        getStatusColor(status),
        className
      )}
    >
      {status.toUpperCase()}
    </span>
  );
}
