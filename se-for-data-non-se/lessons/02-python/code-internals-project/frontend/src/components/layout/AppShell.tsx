import { Home } from "lucide-react";
import { motion } from "framer-motion";
import type { PanelId } from "../../lib/types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { TabNav } from "./TabNav";

interface AppShellProps {
  activePanel: PanelId;
  onPanelChange: (id: PanelId) => void;
  onGoStart: () => void;
  isStartActive: boolean;
  children: React.ReactNode;
}

export function AppShell({
  activePanel,
  onPanelChange,
  onGoStart,
  isStartActive,
  children,
}: AppShellProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ci-bg ambient-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_18%,color-mix(in_srgb,var(--color-ci-cyan)_20%,transparent)_0%,transparent_42%),radial-gradient(circle_at_85%_-8%,color-mix(in_srgb,var(--color-ci-purple)_20%,transparent)_0%,transparent_38%)]"
      />
      <header className="sticky top-0 z-50 border-b border-ci-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-ci-panel)_95%,transparent)_0%,color-mix(in_srgb,var(--color-ci-bg)_86%,transparent)_100%)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onGoStart}
              aria-current={isStartActive ? "page" : undefined}
              aria-label="Start"
              className={`relative isolate flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-cyan/85 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg sm:px-4 ${
                isStartActive
                  ? "border-ci-cyan text-ci-text"
                  : "border-ci-border/80 text-ci-cyan hover:border-ci-cyan/70 hover:bg-ci-surface/55 hover:text-ci-text"
              }`}
            >
              {isStartActive ? (
                <motion.span
                  layoutId="active-tab-pill"
                  className="absolute inset-0 -z-10 rounded-lg border border-ci-cyan bg-ci-surface/95 shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-cyan)_80%,transparent)]"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.68 }
                  }
                />
              ) : null}
              <Home size={16} aria-hidden="true" />
              <span className="hidden md:inline">Start</span>
            </button>
          </div>
          <TabNav activeTab={activePanel} onTabChange={onPanelChange} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
