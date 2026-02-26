import React, { useState } from 'react';
import { PageTitleBlock } from '../shared/PageTitleBlock';
import { PacketFeed } from './PacketFeed';
import { MetricsPanel } from './MetricsPanel';

export function NetworkMonitor() {
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  return (
    <div className="h-full flex flex-col">
      <PageTitleBlock 
        eyebrow="OBSERVABILITY" 
        title="Network Monitor" 
        subtitle="Live packet inspection and network metrics." 
      />
      
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          {['ALL', 'HTTP', 'SQL', 'SSE', 'gRPC', 'DNS'].map(p => (
            <button
              key={p}
              onClick={() => setProtocolFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-mono border ${protocolFilter === p ? 'bg-pq-blue/20 text-pq-blue border-pq-blue/50' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex gap-2">
          {['ALL', 'TRAVELING', 'DELIVERED', 'BLOCKED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-mono border ${statusFilter === s ? 'bg-pq-purple/20 text-pq-purple border-pq-purple/50' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 h-full overflow-hidden">
          <PacketFeed protocolFilter={protocolFilter} statusFilter={statusFilter} />
        </div>
        <div className="h-full">
          <MetricsPanel />
        </div>
      </div>
    </div>
  );
}
