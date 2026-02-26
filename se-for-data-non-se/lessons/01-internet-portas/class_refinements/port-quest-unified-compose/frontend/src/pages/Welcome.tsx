import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Activity, Shield, Trophy, ArrowRight, Server, Network, Zap } from 'lucide-react';
import { GlassPanel } from '../components/shared/GlassPanel';
import { useCityStatus } from '../hooks/useCityStatus';

const cards = [
  {
    title: 'City Map',
    description: 'Explore the isometric network topology. Send packets and inspect buildings.',
    icon: Map,
    path: '/map',
    accent: '#00ccff',
  },
  {
    title: 'Network Monitor',
    description: 'Watch live packets flow through the city in real-time. Analyze latency and payloads.',
    icon: Activity,
    path: '/monitor',
    accent: '#00ff88',
  },
  {
    title: 'Security Lab',
    description: 'Toggle firewalls, simulate TLS handshakes, and resolve DNS queries.',
    icon: Shield,
    path: '/security',
    accent: '#ff9922',
  },
  {
    title: 'Challenges',
    description: 'Test your knowledge of ports, protocols, and network security concepts.',
    icon: Trophy,
    path: '/challenges',
    accent: '#bb66ff',
  },
];

export function Welcome() {
  const { status } = useCityStatus();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 ambient-radial -z-10" />
      <div className="absolute inset-0 ambient-grid opacity-30 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        <div className="inline-flex flex-col items-center rounded-3xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-md mb-6">
          <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-pq-blue via-pq-purple to-pq-green mb-4 shadow-[0_0_18px_rgba(0,204,255,0.35)]" />
          <h1
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none"
            style={{
              textShadow:
                '0 3px 4px rgba(0,0,0,0.75), 0 0 24px rgba(0,0,0,0.5), 0 0 2px rgba(255,255,255,0.35)',
            }}
          >
            PORT QUEST CITY
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
          Explore how networks, ports, and protocols power the internet — one packet at a time.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full mb-16 z-10">
        {cards.map((card, i) => (
          <motion.div
            key={card.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Link to={card.path} className="block h-full">
              <GlassPanel accent={card.accent} className="h-full p-8 group hover:-translate-y-1 transition-transform duration-300">
                <card.icon className="w-10 h-10 mb-6" style={{ color: card.accent }} />
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                  {card.title}
                </h2>
                <p className="text-slate-400 mb-6">{card.description}</p>
                <div className="flex items-center gap-2 text-sm font-bold tracking-wider" style={{ color: card.accent }}>
                  ENTER <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassPanel>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-wrap justify-center gap-4 w-full max-w-4xl z-10"
      >
        <GlassPanel className="px-6 py-3 flex items-center gap-3">
          <Server className="w-5 h-5 text-pq-blue" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buildings Online</span>
            <span className="text-lg font-mono font-bold text-white">{status?.buildings?.filter(b => b.status === 'running').length || 0}/4</span>
          </div>
        </GlassPanel>
        <GlassPanel className="px-6 py-3 flex items-center gap-3">
          <Network className="w-5 h-5 text-pq-amber" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Connections</span>
            <span className="text-lg font-mono font-bold text-white">{status?.active_connections || 0}</span>
          </div>
        </GlassPanel>
        <GlassPanel className="px-6 py-3 flex items-center gap-3">
          <Zap className="w-5 h-5 text-pq-purple" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Packets / Sec</span>
            <span className="text-lg font-mono font-bold text-white">{status?.packets_per_second || 0}</span>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
