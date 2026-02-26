import React, { useState } from 'react';
import { Search, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../shared/GlassPanel';
import { api } from '../../lib/api';
import { DNSStep } from '../../lib/types';

export function DNSResolver() {
  const [domain, setDomain] = useState('api.portquest.city');
  const [steps, setSteps] = useState<DNSStep[]>([]);
  const [resolving, setResolving] = useState(false);

  const resolve = async () => {
    setResolving(true);
    setSteps([]);
    try {
      const res = await api.resolveDNS(domain);
      // Animate steps
      for (let i = 0; i < res.length; i++) {
        await new Promise(r => setTimeout(r, 500));
        setSteps(prev => [...prev, res[i]]);
      }
    } catch (e) {
      console.error(e);
    }
    setResolving(false);
  };

  return (
    <GlassPanel accent="#bb66ff" className="p-6 flex-1">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-6 h-6 text-pq-purple" />
        <h2 className="text-xl font-bold text-white">DNS Resolver</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-pq-purple/50"
        />
        <button
          onClick={resolve}
          disabled={resolving}
          className="bg-pq-purple text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          RESOLVE
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/20 border border-white/5 rounded-lg p-4 relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-pq-purple rounded-l-lg" />
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-pq-purple uppercase">{step.server}</span>
              <span className="text-xs font-mono text-slate-500">{step.latency_ms}ms</span>
            </div>
            <p className="text-sm text-slate-300 mb-2">{step.description}</p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block mb-1">Query</span>
                <span className="text-pq-cyan">{step.query}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Response</span>
                <span className="text-pq-green">{step.response}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
}
