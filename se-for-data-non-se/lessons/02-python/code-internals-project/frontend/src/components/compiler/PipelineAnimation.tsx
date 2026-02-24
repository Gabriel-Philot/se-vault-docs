import type { CompileStage } from "../../lib/types";

interface PipelineAnimationProps {
  stages: CompileStage[];
  type: "c" | "python";
}

const C_STAGES = ["Preprocessor", "Compiler", "Assembler", "Linker", "Execute"];
const PY_STAGES = ["Source", "Bytecode", "PVM", "Output"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-ci-surface border-ci-dim text-ci-dim",
  success: "bg-ci-green/20 border-ci-green text-ci-green",
  error: "bg-ci-red/20 border-ci-red text-ci-red",
  active: "bg-ci-amber/20 border-ci-amber text-ci-amber",
};

export function PipelineAnimation({
  stages,
  type,
}: PipelineAnimationProps) {
  const labels = type === "c" ? C_STAGES : PY_STAGES;

  return (
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4">
      <h3 className="text-sm font-medium text-ci-muted mb-3">
        {type === "c" ? "Compilation" : "Interpretation"} Pipeline
      </h3>
      <div className="flex items-center gap-2 overflow-x-auto">
        {labels.map((label, i) => {
          const stage = stages[i];
          const status = stage?.status ?? "pending";
          const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

          return (
            <div key={label} className="flex items-center">
              <div
                className={`px-3 py-2 rounded-full border text-xs font-mono transition-all duration-300 ${colors}`}
              >
                {label}
                {stage?.time_ms != null && (
                  <span className="ml-1 text-[10px] opacity-70">
                    {stage.time_ms.toFixed(1)}ms
                  </span>
                )}
              </div>
              {i < labels.length - 1 && (
                <span className="text-ci-dim mx-1">&rarr;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
