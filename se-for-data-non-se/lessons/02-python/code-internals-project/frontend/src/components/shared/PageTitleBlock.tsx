interface PageTitleBlockProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  className?: string;
}

export function PageTitleBlock({
  eyebrow,
  title,
  subtitle,
  className = "",
}: PageTitleBlockProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-ci-cyan">
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-ci-text/90 sm:text-lg">{subtitle}</p>
    </div>
  );
}
