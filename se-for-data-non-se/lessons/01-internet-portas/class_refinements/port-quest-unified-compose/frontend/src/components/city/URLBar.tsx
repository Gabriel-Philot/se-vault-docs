import React, { useState } from 'react';
import { Play, Globe } from 'lucide-react';
import { GlassPanel } from '../shared/GlassPanel';
import { api } from '../../lib/api';

type SendIntent = {
  destination: string;
  payload: string;
  protocol: string;
  displayUrl: string;
};

function parseSendIntent(rawUrl: string): SendIntent {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      destination: 'gateway',
      payload: 'GET /',
      protocol: 'HTTP',
      displayUrl: 'http://gateway/',
    };
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return {
      destination: trimmed,
      payload: `GET ${trimmed}`,
      protocol: 'HTTP',
      displayUrl: trimmed,
    };
  }

  const host = parsed.hostname || 'gateway';
  const path = `${parsed.pathname || '/'}${parsed.search}${parsed.hash}`;
  const method = 'GET';

  let logicalDestination = host;
  if (/^gateway$/i.test(host)) {
    if (path.startsWith('/api/')) logicalDestination = 'api';
    else if (path.startsWith('/health')) logicalDestination = 'gateway';
  }

  let protocol = 'HTTP';
  if (parsed.protocol.startsWith('https')) protocol = 'HTTP';
  if (/grpc/i.test(host) || /grpc/i.test(path)) protocol = 'gRPC';
  if (/dns/i.test(host) || /dns/i.test(path)) protocol = 'DNS';
  if (/db|postgres|sql|database/i.test(host) || /sql/i.test(path)) protocol = 'SQL';

  return {
    destination: logicalDestination,
    payload: `${method} ${path}`,
    protocol,
    displayUrl: parsed.toString(),
  };
}

export function URLBar() {
  const [url, setUrl] = useState('http://gateway:80/api/data');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    const intent = parseSendIntent(url);
    try {
      await api.sendPacket({
        source: 'frontend',
        destination: intent.destination,
        protocol: intent.protocol,
        payload: intent.payload,
      });
      window.dispatchEvent(new CustomEvent('portquest:packet-send', { detail: intent }));
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
