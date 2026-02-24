import type { HTMLAttributes } from "react";

type Accent = "cyan" | "green" | "amber" | "blue" | "purple" | "red" | "none";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
}

const ACCENT_STYLES: Record<Accent, { border: string; glow: string; line: string }> = {
  cyan: {
    border: "border-ci-cyan/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-cyan)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-cyan/70 to-transparent",
  },
  green: {
    border: "border-ci-green/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-green)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-green/70 to-transparent",
  },
  amber: {
    border: "border-ci-amber/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-amber)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-amber/70 to-transparent",
  },
  blue: {
    border: "border-ci-blue/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-blue)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-blue/70 to-transparent",
  },
  purple: {
    border: "border-ci-purple/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-purple)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-purple/70 to-transparent",
  },
  red: {
    border: "border-ci-red/35",
    glow: "shadow-[0_0_26px_-16px_color-mix(in_srgb,var(--color-ci-red)_80%,transparent)]",
    line: "bg-gradient-to-r from-transparent via-ci-red/70 to-transparent",
  },
  none: {
    border: "",
    glow: "",
    line: "",
  },
};

export function GlassPanel({ className = "", accent = "none", ...props }: GlassPanelProps) {
  const accentStyle = ACCENT_STYLES[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ci-border/70 bg-ci-panel/70 p-6 shadow-[0_24px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md ${accentStyle.border} ${accentStyle.glow} ${className}`}
      {...props}
    >
      {accent !== "none" ? (
        <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accentStyle.line}`} />
      ) : null}
      {props.children}
    </div>
  );
}
