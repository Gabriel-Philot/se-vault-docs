import React, { useState } from 'react';
import { Play, Globe } from 'lucide-react';
import { GlassPanel } from '../shared/GlassPanel';
import { api } from '../../lib/api';

export function URLBar() {
  const [url, setUrl] = useState('http://gateway:80/api/data');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.sendPacket({
        source: 'frontend',
        destination: 'gateway',
        protocol: 'HTTP',
        payload: 'GET /api/data'
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setSending(false), 1000);
  };

  return (
    <GlassPanel className="p-4 mb-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center bg-pq-bg/50 rounded-full px-4 py-2 border border-white/10">
          <Globe className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-white font-mono text-sm"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-pq-blue hover:bg-pq-blue/80 text-pq-bg font-bold px-6 py-2 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          SEND
        </button>
      </div>
      <div className="flex items-center justify-between px-8">
        {['Browser', 'Gateway:80', 'API:8000', 'DB:5432'].map((step, i) => (
          <div key={step} className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${sending ? 'bg-pq-blue animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-mono text-slate-400">{step}</span>
            {i < 3 && <div className="w-16 h-px bg-slate-700" />}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
