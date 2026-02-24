import type { StackFrame } from "../../lib/types";
import { StackFrameComponent } from "./StackFrameComponent";

interface StackColumnProps {
  frames: StackFrame[];
}

export function StackColumn({ frames }: StackColumnProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ci-blue border-b border-ci-blue/30 pb-1">
        STACK
      </h3>
      {frames.length === 0 ? (
        <p className="text-xs text-ci-dim">No stack frames</p>
      ) : (
        <div className="space-y-2">
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
