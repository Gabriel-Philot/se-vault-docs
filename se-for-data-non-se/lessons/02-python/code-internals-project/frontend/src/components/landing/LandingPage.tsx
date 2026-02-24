import { motion } from "framer-motion";
import { ArrowRight, Binary, Cpu, Layers, Terminal } from "lucide-react";
import { PANEL_CONFIG } from "../../lib/constants";
import type { PanelId } from "../../lib/types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import LetterGlitch from "./LetterGlitch";

interface LandingPageProps {
  onEnter: (panel: PanelId) => void;
}

const ICONS: Record<PanelId, React.ElementType> = {
  bytes: Binary,
  shell: Terminal,
  compiler: Cpu,
  memory: Layers,
};

const DETAILS: Record<PanelId, string> = {
  bytes: "Text, bytes, and binary representation",
  shell: "Processes, pipes, and execution flow",
  compiler: "C stages and Python bytecode contrast",
  memory: "Stack frames, heap objects, references",
};

const CARD_TONE: Record<PanelId, { icon: string; iconBg: string; cmd: string; border: string }> = {
  bytes: {
    icon: "text-ci-cyan",
    iconBg: "bg-ci-cyan/12",
    cmd: "/bytes",
    border: "hover:border-ci-cyan/40",
  },
  shell: {
    icon: "text-ci-green",
    iconBg: "bg-ci-green/12",
    cmd: "/shell",
    border: "hover:border-ci-green/40",
  },
  compiler: {
    icon: "text-ci-amber",
    iconBg: "bg-ci-amber/12",
    cmd: "/compiler",
    border: "hover:border-ci-amber/40",
  },
  memory: {
    icon: "text-ci-blue",
    iconBg: "bg-ci-blue/12",
    cmd: "/memory",
    border: "hover:border-ci-blue/40",
  },
};

export function LandingPage({ onEnter }: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <LetterGlitch
        className="absolute inset-0"
        glitchSpeed={50}
        centerVignette={false}
        outerVignette={false}
        smooth={true}
      />
      <div className="absolute inset-0 bg-black/22" />

      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6"
      >
        <div className="w-full max-w-5xl rounded-[30px] border border-white/28 bg-black/34 px-6 py-8 text-center shadow-[0_30px_100px_-40px_rgba(0,0,0,0.95)] backdrop-blur-[1.5px] sm:px-10 sm:py-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              delay: prefersReducedMotion ? 0 : 0.08,
              ease: "easeOut",
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/6 px-3 py-1 text-xs font-mono text-ci-text/90 shadow-[0_10px_24px_-18px_rgba(0,0,0,1)]">
              <Terminal size={13} className="text-ci-green" />
              <span>system_init()</span>
            </div>

            <h2 className="mt-5 text-6xl font-semibold tracking-tight text-white drop-shadow-[0_16px_40px_rgba(0,0,0,1)] sm:text-7xl">
              Machine<span className="text-white/58">Matrix</span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/86 drop-shadow-[0_10px_26px_rgba(0,0,0,1)] sm:text-xl">
              Explore bytes and encodings, shell/process behavior, compiled vs interpreted execution,
              and stack/heap memory flow in one interactive workspace built for software engineering for data.
            </p>

            <motion.nav
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.35,
                delay: prefersReducedMotion ? 0 : 0.14,
                ease: "easeOut",
              }}
              className="mx-auto mt-9"
              aria-label="Landing panel menu"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {PANEL_CONFIG.map(({ id, label }) => {
                  const Icon = ICONS[id];
                  const tone = CARD_TONE[id];
                  return (
                    <button
                      key={`landing-action-${id}`}
                      type="button"
                      onClick={() => onEnter(id)}
                      className={`group flex h-full flex-col rounded-2xl border border-white/18 bg-black/32 p-5 text-left text-white shadow-[0_16px_40px_-26px_rgba(0,0,0,1)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-black/48 ${tone.border} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className={`rounded-lg border border-white/10 p-3 ${tone.iconBg}`}>
                          <Icon size={18} aria-hidden="true" className={tone.icon} />
                        </div>
                        <ArrowRight size={16} className="mt-1 text-white/45 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white" />
                      </div>

                      <div className="text-base font-semibold tracking-tight text-white">
                        {label}
                      </div>
                      <p className="mt-2 flex-grow text-sm leading-relaxed text-white/72">{DETAILS[id]}</p>

                      <div className="mt-5 border-t border-white/10 pt-3 text-xs font-mono text-white/50 transition-colors duration-200 group-hover:text-white/78">
                        <span>cd {tone.cmd}</span>
                        <span className="ml-1 animate-pulse">_</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
