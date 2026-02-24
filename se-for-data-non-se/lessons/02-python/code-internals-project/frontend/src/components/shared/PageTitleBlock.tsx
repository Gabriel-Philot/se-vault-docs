interface PageTitleBlockProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  accent?: "cyan" | "green" | "amber" | "blue" | "purple" | "red";
  className?: string;
}

const ACCENT_STYLES = {
  cyan: {
    eyebrow: "text-ci-cyan",
    line: "via-ci-cyan/70",
  },
  green: {
    eyebrow: "text-ci-green",
    line: "via-ci-green/70",
  },
  amber: {
    eyebrow: "text-ci-amber",
    line: "via-ci-amber/70",
  },
  blue: {
    eyebrow: "text-ci-blue",
    line: "via-ci-blue/70",
  },
  purple: {
    eyebrow: "text-ci-purple",
    line: "via-ci-purple/70",
  },
  red: {
    eyebrow: "text-ci-red",
    line: "via-ci-red/70",
  },
} as const;

export function PageTitleBlock({
  eyebrow,
  title,
  subtitle,
  accent = "cyan",
  className = "",
}: PageTitleBlockProps) {
  const accentStyles = ACCENT_STYLES[accent];

  return (
    <div className={className}>
      {eyebrow && (
        <p className={`mb-3 font-mono text-xs uppercase tracking-[0.24em] ${accentStyles.eyebrow}`}>
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ci-text/90 sm:text-base">{subtitle}</p>
      <div className={`mt-4 h-px w-full max-w-xs bg-gradient-to-r from-transparent ${accentStyles.line} to-transparent`} />
    </div>
  );
}
