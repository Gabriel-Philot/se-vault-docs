import { useCallback, useEffect, useRef, useState } from "react";
import { Binary, Cpu, Layers, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { PANEL_CONFIG } from "../../lib/constants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { PanelId } from "../../lib/types";

const ICONS: Record<PanelId, React.ElementType> = {
  bytes: Binary,
  shell: Terminal,
  compiler: Cpu,
  memory: Layers,
};

const ACCENT_STYLES: Record<
  string,
  {
    border: string;
    glow: string;
  }
> = {
  "ci-cyan": {
    border: "border-ci-cyan",
    glow: "shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-cyan)_80%,transparent)]",
  },
  "ci-green": {
    border: "border-ci-green",
    glow: "shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-green)_80%,transparent)]",
  },
  "ci-amber": {
    border: "border-ci-amber",
    glow: "shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-amber)_80%,transparent)]",
  },
  "ci-blue": {
    border: "border-ci-blue",
    glow: "shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-blue)_80%,transparent)]",
  },
  "ci-purple": {
    border: "border-ci-purple",
    glow: "shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--color-ci-purple)_80%,transparent)]",
  },
};

interface TabNavProps {
  activeTab: PanelId;
  onTabChange: (id: PanelId) => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScrollLeft - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollerRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateScrollHints);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateScrollHints);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollHints);
    };
  }, [updateScrollHints]);

  return (
    <div className="relative max-w-full">
      <nav
        ref={scrollerRef}
        onScroll={updateScrollHints}
        className="max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main navigation"
      >
        <div className="inline-flex min-w-max items-center gap-2 rounded-xl border border-ci-border/80 bg-ci-panel/65 p-1 backdrop-blur-sm">
          {PANEL_CONFIG.map(({ id, label, accent }) => {
            const Icon = ICONS[id];
            const isActive = activeTab === id;
            const accentStyles = ACCENT_STYLES[accent] ?? ACCENT_STYLES["ci-cyan"];

            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className={`relative isolate flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-cyan/85 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg sm:px-4 ${
                  isActive ? "text-ci-text" : "text-ci-muted hover:bg-ci-surface/55 hover:text-ci-text"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="active-tab-pill"
                    className={`absolute inset-0 -z-10 rounded-lg border bg-ci-surface/95 ${accentStyles.border} ${accentStyles.glow}`}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34, mass: 0.68 }
                    }
                  />
                ) : null}
                <Icon size={16} aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {canScrollLeft ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-gradient-to-r from-ci-bg via-ci-bg/75 to-transparent"
        />
      ) : null}
      {canScrollRight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 rounded-r-xl bg-gradient-to-l from-ci-bg via-ci-bg/80 to-transparent pr-1 pl-8"
        >
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ci-muted/85 sm:inline">
            Swipe
          </span>
          <span className="font-mono text-xs text-ci-cyan/90">&rarr;</span>
        </div>
      ) : null}
    </div>
  );
}
