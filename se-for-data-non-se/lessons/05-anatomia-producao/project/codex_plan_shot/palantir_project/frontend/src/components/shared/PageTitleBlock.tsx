import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type PageTitleBlockProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  accent?: "gold" | "amber" | "blue" | "green";
  compact?: boolean;
  leadDot?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
};

function accentTone(accent: NonNullable<PageTitleBlockProps["accent"]>) {
  switch (accent) {
    case "amber":
      return {
        eyebrow: "text-amber-200/85",
        title: "text-amber-200",
        line: "from-amber-200/70 via-amber-100/30 to-transparent"
      };
    case "blue":
      return {
        eyebrow: "text-sky-200/85",
        title: "text-sky-100",
        line: "from-sky-300/65 via-sky-200/25 to-transparent"
      };
    case "green":
      return {
        eyebrow: "text-emerald-200/85",
        title: "text-emerald-100",
        line: "from-emerald-300/65 via-emerald-200/25 to-transparent"
      };
    case "gold":
    default:
      return {
        eyebrow: "text-pal-gold/85",
        title: "text-pal-gold",
        line: "from-pal-gold/70 via-pal-gold/25 to-transparent"
      };
  }
}

export function PageTitleBlock({
  eyebrow = "Command Theater",
  title,
  subtitle,
  align = "left",
  accent = "gold",
  compact = false,
  leadDot = false,
  actions,
  children
}: PageTitleBlockProps) {
  const reducedMotion = useReducedMotion();
  const tone = accentTone(accent);
  const alignClasses = align === "center" ? "items-center text-center" : "items-start text-left";
  const titleSize = compact ? "text-2xl md:text-3xl" : "text-2xl md:text-3xl";

  const fadeUp = reducedMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className={`px-1 ${align === "center" ? "flex justify-center" : ""}`}>
      <div className={`flex w-full flex-col gap-2 ${alignClasses}`}>
        <div className={`flex w-full flex-wrap items-start justify-between gap-3 ${align === "center" ? "justify-center" : ""}`}>
          <div className={`flex min-w-0 flex-col gap-1.5 ${alignClasses}`}>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ${tone.eyebrow}`}
            >
              {leadDot ? <span className="inline-block h-2.5 w-2.5 rounded-full bg-current/90 shadow-[0_0_10px_currentColor]" /> : null}
              <span>{eyebrow}</span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.28, ease: "easeOut", delay: reducedMotion ? 0 : 0.04 }}
              className={`${titleSize} font-semibold tracking-tight ${tone.title} drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]`}
            >
              {title}
            </motion.h1>

            {subtitle ? (
              <motion.p
                {...fadeUp}
                transition={{ duration: 0.28, ease: "easeOut", delay: reducedMotion ? 0 : 0.09 }}
                className="max-w-[90ch] text-sm text-pal-text/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
              >
                {subtitle}
              </motion.p>
            ) : null}
          </div>

          {actions ? <div className={align === "center" ? "" : "shrink-0"}>{actions}</div> : null}
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scaleX: 0.75 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.26, ease: "easeOut", delay: reducedMotion ? 0 : 0.12 }}
          className={`h-px w-full origin-left bg-gradient-to-r ${tone.line} ${align === "center" ? "mx-auto max-w-3xl" : ""}`}
          aria-hidden="true"
        />

        {children ? (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.26, ease: "easeOut", delay: reducedMotion ? 0 : 0.14 }}
            className={compact ? "mt-0.5" : "mt-1"}
          >
            {children}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

