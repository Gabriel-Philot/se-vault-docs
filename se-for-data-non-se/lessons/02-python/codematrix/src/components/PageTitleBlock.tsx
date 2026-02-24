import { cn } from "../utils/cn";

interface PageTitleBlockProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  accentColor?: "cyan" | "green" | "amber" | "blue" | "red" | "purple";
  className?: string;
}

export function PageTitleBlock({ eyebrow, title, subtitle, accentColor = "cyan", className }: PageTitleBlockProps) {
  const accentText = {
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

  const accentBorder = {
    cyan: "border-cyan-500/30",
    green: "border-emerald-500/30",
    amber: "border-amber-500/30",
    blue: "border-blue-500/30",
    red: "border-red-500/30",
    purple: "border-purple-500/30",
  };

  return (
    <div className={cn("mb-8", className)}>
      <div className={cn("text-xs font-mono uppercase tracking-widest mb-2 font-semibold", accentText[accentColor])}>
        {eyebrow}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h1>
      <p className="text-slate-400 text-sm md:text-base max-w-2xl mb-4">
        {subtitle}
      </p>
      <div className={cn("h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent to-transparent", 
        accentColor === "cyan" && "via-cyan-500/50",
        accentColor === "green" && "via-emerald-500/50",
        accentColor === "amber" && "via-amber-500/50",
        accentColor === "blue" && "via-blue-500/50",
        accentColor === "red" && "via-red-500/50",
        accentColor === "purple" && "via-purple-500/50"
      )} />
    </div>
  );
}
