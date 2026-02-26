import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Activity, Shield, Trophy, Hexagon } from 'lucide-react';
import { cn } from '../shared/GlassPanel';

const navItems = [
  { path: '/map', label: 'City Map', icon: Map },
  { path: '/monitor', label: 'Network Monitor', icon: Activity },
  { path: '/security', label: 'Security Lab', icon: Shield },
  { path: '/challenges', label: 'Challenges', icon: Trophy },
];

export function TopNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-pq-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white hover:text-pq-blue transition-colors">
          <Hexagon className="w-6 h-6 text-pq-blue" />
          <span className="font-bold tracking-wider text-lg">PORT QUEST</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.68 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
