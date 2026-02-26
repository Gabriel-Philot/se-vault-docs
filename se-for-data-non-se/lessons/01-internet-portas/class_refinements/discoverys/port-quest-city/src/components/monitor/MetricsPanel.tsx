import React from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { useCityStatus } from '../../hooks/useCityStatus';
import { useSSE } from '../../hooks/useSSE';
import { Activity, Zap, Network } from 'lucide-react';

export function MetricsPanel() {
  const { status } = useCityStatus();
  const { connected } = useSSE();

  return (
    <div className="flex flex-col gap-4 h-full">
      <GlassPanel accent="#00ccff" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">SSE Connection</h3>
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-pq-green shadow-[0_0_10px_#00ff88]' : 'bg-pq-red shadow-[0_0_10px_#ff4444]'}`} />
        </div>
        <div className="text-2xl font-bold text-white">
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </GlassPanel>

      <GlassPanel accent="#bb66ff" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-pq-purple" />
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Packets / Sec</h3>
        </div>
        <div className="text-4xl font-mono font-bold text-white">
          {status?.packets_per_second || 0}
        </div>
      </GlassPanel>

      <GlassPanel accent="#ff9922" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-pq-amber" />
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Active Connections</h3>
        </div>
        <div className="text-4xl font-mono font-bold text-white">
          {status?.active_connections || 0}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-pq-blue" />
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Latency Trend</h3>
        </div>
        <div className="flex-1 flex items-end gap-1">
          {/* Fake sparkline */}
          {Array.from({ length: 20 }).map((_, i) => {
            const height = 20 + Math.random() * 60;
            return (
              <div 
                key={i} 
                className="flex-1 bg-pq-blue/40 rounded-t-sm transition-all duration-500"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}
