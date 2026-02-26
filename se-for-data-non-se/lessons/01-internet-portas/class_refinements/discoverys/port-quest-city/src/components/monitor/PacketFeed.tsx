import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSSE } from '../../hooks/useSSE';
import { GlassPanel } from '../shared/GlassPanel';
import { StatusBadge } from '../shared/StatusBadge';
import { PROTOCOL_COLORS } from '../../lib/constants';

interface PacketFeedProps {
  protocolFilter: string;
  statusFilter: string;
}

export function PacketFeed({ protocolFilter, statusFilter }: PacketFeedProps) {
  const { packets } = useSSE();

  const filteredPackets = packets.filter(p => {
    if (protocolFilter !== 'ALL' && p.protocol !== protocolFilter) return false;
    if (statusFilter !== 'ALL' && p.status.toUpperCase() !== statusFilter) return false;
    return true;
  });

  return (
    <GlassPanel accent="#00ff88" className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 bg-black/20">
        <h3 className="font-semibold text-white">Live Packet Feed</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {filteredPackets.map((packet) => (
            <motion.div
              key={packet.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`p-3 rounded-lg border bg-black/40 flex items-center gap-4 ${packet.status === 'blocked' ? 'border-pq-red/50 shadow-[0_0_10px_rgba(255,68,68,0.2)]' : 'border-white/10'}`}
            >
              <div 
                className="w-12 text-center py-1 rounded text-xs font-bold font-mono"
                style={{ backgroundColor: `${PROTOCOL_COLORS[packet.protocol] || '#fff'}20`, color: PROTOCOL_COLORS[packet.protocol] || '#fff' }}
              >
                {packet.protocol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-mono text-slate-300 mb-1">
                  <span>{packet.source}:{packet.source_port}</span>
                  <span className="text-slate-500">→</span>
                  <span>{packet.destination}:{packet.destination_port}</span>
                </div>
                <div className="text-xs text-slate-500 truncate font-mono">
                  {packet.payload_preview}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={packet.status} />
                <span className="text-xs text-slate-500 font-mono">{packet.latency_ms}ms</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredPackets.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            Waiting for packets...
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
