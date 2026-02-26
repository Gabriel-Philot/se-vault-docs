import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { GlassPanel } from '../shared/GlassPanel';
import { api } from '../../lib/api';
import { FirewallRule } from '../../lib/types';
import { useCityStatus } from '../../hooks/useCityStatus';

export function FirewallPanel() {
  const { status } = useCityStatus();
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (status) {
      setEnabled(status.firewall_enabled);
    }
    api.getFirewallRules().then(setRules).catch(console.error);
  }, [status]);

  const toggleFirewall = async () => {
    try {
      const res = await api.toggleFirewall(!enabled);
      setEnabled(res.enabled);
      setRules(res.rules);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <GlassPanel accent={enabled ? '#ff4444' : '#56d4dd'} className="p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className={`w-8 h-8 ${enabled ? 'text-pq-red' : 'text-pq-cyan'}`} />
          <h2 className="text-2xl font-bold text-white">City Firewall</h2>
        </div>
        <button
          onClick={toggleFirewall}
          className={`px-6 py-2 rounded-full font-bold transition-all ${enabled ? 'bg-pq-red text-white shadow-[0_0_15px_rgba(255,68,68,0.5)]' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
        >
          {enabled ? 'ACTIVE' : 'INACTIVE'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`mb-4 rounded-xl border px-4 py-3 ${enabled ? 'border-pq-red/40 bg-pq-red/10 shadow-[0_0_16px_rgba(255,68,68,0.12)]' : 'border-white/10 bg-white/5'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Municipal Archive</div>
              <div className={`text-sm font-semibold ${enabled ? 'text-white' : 'text-slate-300'}`}>
                {enabled ? 'Protected - inbound database access is locked down' : 'Protection rule inactive'}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Default policy target: database:5432
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${enabled ? 'border-pq-red/40 bg-pq-red/20 text-pq-red' : 'border-white/10 bg-white/5 text-slate-400'}`}>
              {enabled ? 'DB LOCKED' : 'DB OPEN'}
            </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Active Rules</h3>
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-black/20 border border-white/10 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${rule.action === 'ALLOW' ? 'bg-pq-green/20 text-pq-green' : 'bg-pq-red/20 text-pq-red'}`}>
                  {rule.action}
                </span>
                <div className="text-sm font-mono text-slate-300">
                  {rule.source} → {rule.destination}:{rule.port}
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-pq-green" />
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-slate-500 italic">No firewall rules configured.</p>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
