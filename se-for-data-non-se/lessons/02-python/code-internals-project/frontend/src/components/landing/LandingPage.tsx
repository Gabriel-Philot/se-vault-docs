import { motion } from "framer-motion";
import { Binary, Cpu, Layers, Terminal } from "lucide-react";
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
      <div className="absolute inset-0 bg-black/20" />

      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6"
      >
        <div className="w-full max-w-[760px] rounded-[28px] border border-white/30 bg-black/25 px-6 py-8 text-center backdrop-blur-[1px] sm:px-10 sm:py-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              delay: prefersReducedMotion ? 0 : 0.08,
              ease: "easeOut",
            }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-100 drop-shadow-[0_8px_24px_rgba(0,0,0,1)]">
              Software Engineering for Data | Learning Workspace
            </p>

            <h2 className="mt-3 text-5xl font-semibold tracking-tight text-white drop-shadow-[0_16px_40px_rgba(0,0,0,1)] sm:text-6xl">
              MachineMatrix
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-white drop-shadow-[0_10px_26px_rgba(0,0,0,1)] sm:text-lg">
              Choose a panel to practice how Python code is represented, transformed,
              and executed through each system layer.
            </p>

            <motion.nav
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.35,
                delay: prefersReducedMotion ? 0 : 0.14,
                ease: "easeOut",
              }}
              className="mx-auto mt-7"
              aria-label="Landing panel menu"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {PANEL_CONFIG.map(({ id, label }) => {
                  const Icon = ICONS[id];
                  return (
                    <button
                      key={`landing-action-${id}`}
                      type="button"
                      onClick={() => onEnter(id)}
                      className="group rounded-2xl border border-white/35 bg-black/30 p-4 text-left text-white transition-colors duration-200 hover:border-cyan-200/70 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon size={16} aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                      <p className="mt-2 text-xs text-white/75">{DETAILS[id]}</p>
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
