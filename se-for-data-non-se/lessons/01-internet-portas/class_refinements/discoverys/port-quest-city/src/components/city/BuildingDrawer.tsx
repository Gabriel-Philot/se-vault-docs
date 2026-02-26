import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Building } from '../../lib/types';
import { GlassPanel } from '../shared/GlassPanel';
import { StatusBadge } from '../shared/StatusBadge';

interface BuildingDrawerProps {
  building: Building | null;
  onClose: () => void;
}

export function BuildingDrawer({ building, onClose }: BuildingDrawerProps) {
  return (
    <AnimatePresence>
      {building && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-0 right-0 w-96 h-full z-10 p-4"
        >
          <GlassPanel accent="#00ccff" className="h-full flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{building.name}</h2>
                <div className="flex items-center gap-2">
                  <StatusBadge status={building.status} />
                  <span className="text-xs font-mono text-slate-400">Port {building.port}</span>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Service</h3>
                <p className="text-white font-mono">{building.service}</p>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Networks</h3>
                <div className="flex gap-2">
                  {building.networks.map(net => (
                    <span key={net} className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-slate-300 border border-white/10">
                      {net}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Connections</h3>
                <div className="space-y-2">
                  {building.connections?.map(conn => (
                    <div key={conn.id} className="bg-black/20 p-3 rounded border border-white/5 flex justify-between items-center">
                      <div className="text-xs font-mono text-slate-300">
                        {conn.source}:{conn.source_port} → {conn.destination}:{conn.destination_port}
                      </div>
                      <StatusBadge status={conn.state} />
                    </div>
                  ))}
                  {(!building.connections || building.connections.length === 0) && (
                    <p className="text-sm text-slate-500 italic">No active connections</p>
                  )}
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
