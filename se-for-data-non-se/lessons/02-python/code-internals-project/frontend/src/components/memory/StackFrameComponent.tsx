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
      className={`rounded-lg border p-3 transition-all duration-300 ${
        isActive
          ? "border-ci-blue bg-ci-blue/10 shadow-[0_0_12px_rgba(88,166,255,0.15)]"
          : "border-ci-border bg-ci-surface"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-medium text-ci-blue">
          {frame.function}()
        </span>
        <span className="text-[10px] font-mono text-ci-dim">
          ret: {frame.return_addr}
        </span>
      </div>
      <div className="space-y-1">
        {frame.variables.map((v) => (
          <div
            key={v.name}
            className="flex items-center gap-2 text-xs font-mono"
          >
            <span className="text-ci-text">{v.name}</span>
            <span className="text-ci-dim">:</span>
            <span className="text-ci-muted">{v.type}</span>
            <span className="text-ci-dim">=</span>
            <span className="text-ci-green">{v.value}</span>
            {v.points_to_heap && (
              <span className="text-ci-purple text-[10px]">&rarr; heap</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
