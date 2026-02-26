import React, { useEffect, useRef, useState } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { useCityStatus } from '../../hooks/useCityStatus';
import { useSSE } from '../../hooks/useSSE';
import { Activity, Zap, Network } from 'lucide-react';

export function MetricsPanel() {
  const { status } = useCityStatus();
  const { connected, packets } = useSSE();
  const [latencyBars, setLatencyBars] = useState<number[]>(() => Array.from({ length: 20 }, (_, i) => 32 + (i % 5) * 6));
  const lastPacketIdRef = useRef<string | null>(null);

  useEffect(() => {
    const latest = packets[0];
    if (!latest || latest.id === lastPacketIdRef.current) return;

    lastPacketIdRef.current = latest.id;
    const numericLatency = Number.isFinite(latest.latency_ms) ? Number(latest.latency_ms) : 0;
    const normalized = Math.max(12, Math.min(96, numericLatency > 0 ? 18 + numericLatency * 1.4 : 22));

    setLatencyBars((prev) => {
      const next = [...prev.slice(1), normalized];
      return next;
    });
  }, [packets]);

  return (
    <div className="flex flex-col gap-4 h-auto lg:h-full">
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

      <GlassPanel className="p-6 flex flex-col min-h-[220px] lg:flex-1">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-pq-blue" />
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Latency Trend</h3>
        </div>
        <div className="h-36 sm:h-40 lg:h-auto lg:flex-1 lg:min-h-[140px] flex items-end gap-1">
          {latencyBars.map((height, i) => {
            const isRecent = i >= latencyBars.length - 3;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-[height,background-color,box-shadow] duration-300 ${isRecent ? 'bg-pq-blue/65 shadow-[0_0_10px_rgba(0,204,255,0.25)]' : 'bg-pq-blue/35'}`}
                style={{ height: `${height}%` }}
                title={`${Math.round(height)}%`}
              />
            );
          })}
        </div>
        <div className="mt-3 text-xs font-mono text-slate-500">
          Based on recent packet latency samples ({packets.length} packets in buffer)
        </div>
      </GlassPanel>
    </div>
  );
}
