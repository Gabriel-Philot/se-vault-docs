import type { StackFrame } from "../../lib/types";
import { StackFrameComponent } from "./StackFrameComponent";

interface StackColumnProps {
  frames: StackFrame[];
}

export function StackColumn({ frames }: StackColumnProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-ci-blue/25 pb-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-ci-blue">
          Stack Memory
        </h3>
        <span className="rounded-full border border-ci-blue/30 bg-ci-blue/10 px-2 py-0.5 text-[10px] font-mono text-ci-blue">
          {frames.length} frame{frames.length === 1 ? "" : "s"}
        </span>
      </div>
      {frames.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ci-border px-3 py-4 text-xs text-ci-dim">
          No stack frames
        </p>
      ) : (
        <div className="space-y-2 rounded-lg border border-ci-border/70 bg-ci-bg/25 p-2">
          {[...frames].reverse().map((frame, i) => (
            <StackFrameComponent
              key={`${frame.function}-${i}`}
              frame={frame}
              isActive={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
