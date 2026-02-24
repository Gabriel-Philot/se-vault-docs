import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Terminal, Cpu, Database, Binary, ArrowRight } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel";
import { LetterGlitch } from "../components/LetterGlitch";

const panels = [
  {
    title: "Bytes Explorer",
    desc: "Understand encodings, memory representation, and bitwise operations.",
    icon: Binary,
    path: "/bytes",
    color: "cyan",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    title: "Shell & Process",
    desc: "Explore Linux filesystem, streams, pipes, and process execution.",
    icon: Terminal,
    path: "/shell",
    color: "green",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Compiler Pipeline",
    desc: "Compare compiled C vs interpreted Python execution stages.",
    icon: Cpu,
    path: "/compiler",
    color: "amber",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Stack vs Heap",
    desc: "Visualize memory allocation, stack frames, and pointer behavior.",
    icon: Database,
    path: "/memory",
    color: "blue",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
] as const;

export function Landing() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8">
      <LetterGlitch />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-3xl mx-auto mb-16 z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-mono mb-6">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>system_init()</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
          Code<span className="text-slate-500">Matrix</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
          An interactive educational environment for exploring the hidden layers of computing. 
          From raw bytes to memory management.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full z-10">
        {panels.map((panel, i) => (
          <motion.div
            key={panel.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
          >
            <Link to={panel.path} className="block group h-full">
              <GlassPanel 
                accentColor={panel.color} 
                className="h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/80 cursor-pointer flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${panel.bg} border border-slate-700/50`}>
                    <panel.icon className={`w-6 h-6 ${panel.accent}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">{panel.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                  {panel.desc}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>cd {panel.path}</span>
                  <span className="animate-pulse ml-1">_</span>
                </div>
              </GlassPanel>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
