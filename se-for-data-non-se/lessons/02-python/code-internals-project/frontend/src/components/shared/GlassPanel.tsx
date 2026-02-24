import type { HTMLAttributes } from "react";

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className = "", ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-ci-border/70 bg-ci-panel/70 p-6 shadow-[0_24px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md ${className}`}
      {...props}
    />
  );
}
