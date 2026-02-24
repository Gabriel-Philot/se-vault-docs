import { useCallback, useEffect, useRef, useState } from "react";

const STEPS = [
  "Login",
  "/etc/passwd",
  "/etc/profile",
  "~/.bash_profile",
  "~/.bashrc",
  "Shell Ready",
];

interface BashStartupChainProps {
  activeStep?: number;
}

export function BashStartupChain({ activeStep = 5 }: BashStartupChainProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
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
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4">
      <h3 className="text-sm font-medium text-ci-muted mb-3">
        Bash Startup Chain
      </h3>
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateScrollHints}
          className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
          aria-label="Bash startup sequence"
        >
          <div className="flex min-w-max items-center gap-1 md:flex-wrap md:min-w-0">
            {STEPS.map((step, i) => (
              <div key={step} className="flex shrink-0 items-center md:shrink">
                <div
                  className={
                    i <= activeStep
                      ? "whitespace-nowrap rounded border border-ci-green/30 bg-ci-green/20 px-3 py-1.5 text-xs font-mono text-ci-green transition-colors duration-200"
                      : "whitespace-nowrap rounded border border-ci-border bg-ci-surface px-3 py-1.5 text-xs font-mono text-ci-dim transition-colors duration-200"
                  }
                >
                  {step}
                </div>
                {i < STEPS.length - 1 && (
                  <span className="mx-1 text-ci-dim" aria-hidden="true">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {canScrollLeft ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-lg bg-gradient-to-r from-ci-panel via-ci-panel/80 to-transparent"
          />
        ) : null}
        {canScrollRight ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end rounded-r-lg bg-gradient-to-l from-ci-panel via-ci-panel/80 to-transparent pr-1"
          >
            <span className="font-mono text-[10px] uppercase tracking-wide text-ci-muted/90">
              More
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
