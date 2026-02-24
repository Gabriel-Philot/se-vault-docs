import type { StackFrame } from "../../lib/types";

interface StackFrameComponentProps {
  frame: StackFrame;
  isActive: boolean;
}

export function StackFrameComponent({
  frame,
  isActive,
}: StackFrameComponentProps) {
  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-300 ${
        isActive
          ? "border-ci-blue/60 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-ci-blue)_14%,transparent)_0%,color-mix(in_srgb,var(--color-ci-panel)_95%,transparent)_100%)] shadow-[0_10px_24px_-16px_rgba(88,166,255,0.7)]"
          : "border-ci-border/80 bg-ci-surface/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold text-ci-blue">
          {frame.function}()
        </span>
        <span className="text-[10px] font-mono text-ci-dim">
          ret: {frame.return_addr}
        </span>
      </div>
      <div className="space-y-1.5">
        {frame.variables.map((v) => (
          <div
            key={v.name}
            className="flex items-center gap-2 rounded-md border border-ci-border/60 bg-ci-bg/30 px-2 py-1 text-xs font-mono"
          >
            <span className="text-ci-text/95">{v.name}</span>
            <span className="text-ci-dim">:</span>
            <span className="text-ci-muted">{v.type}</span>
            <span className="text-ci-dim">=</span>
            <span className="truncate text-ci-green">{v.value}</span>
            {v.points_to_heap && (
              <span className="ml-auto rounded-full border border-ci-cyan/40 bg-ci-cyan/10 px-1.5 py-0.5 text-[10px] text-ci-cyan">
                heap ref
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
