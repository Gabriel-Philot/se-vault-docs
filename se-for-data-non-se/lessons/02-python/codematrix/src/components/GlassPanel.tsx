import { ReactNode } from "react";
import { cn } from "../utils/cn";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  accentColor?: "cyan" | "green" | "amber" | "blue" | "red" | "purple" | "none";
}

export function GlassPanel({ children, className, accentColor = "none" }: GlassPanelProps) {
  const accentGlow = {
    cyan: "shadow-[0_0_15px_rgba(6,182,212,0.1)] border-cyan-500/20",
    green: "shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-500/20",
    amber: "shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-500/20",
    blue: "shadow-[0_0_15px_rgba(59,130,246,0.1)] border-blue-500/20",
    red: "shadow-[0_0_15px_rgba(239,68,68,0.1)] border-red-500/20",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.1)] border-purple-500/20",
    none: "",
  };

  return (
    <div className={cn("glass-panel relative overflow-hidden", accentGlow[accentColor], className)}>
      {/* Subtle top gradient line based on accent color */}
      {accentColor !== "none" && (
        <div 
          className={cn(
            "absolute top-0 left-0 w-full h-[1px] opacity-50",
            accentColor === "cyan" && "bg-gradient-to-r from-transparent via-cyan-500 to-transparent",
            accentColor === "green" && "bg-gradient-to-r from-transparent via-emerald-500 to-transparent",
            accentColor === "amber" && "bg-gradient-to-r from-transparent via-amber-500 to-transparent",
            accentColor === "blue" && "bg-gradient-to-r from-transparent via-blue-500 to-transparent",
            accentColor === "red" && "bg-gradient-to-r from-transparent via-red-500 to-transparent",
            accentColor === "purple" && "bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          )}
        />
      )}
      {children}
    </div>
  );
}
