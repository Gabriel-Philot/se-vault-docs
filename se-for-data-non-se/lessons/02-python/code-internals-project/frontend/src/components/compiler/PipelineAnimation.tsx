import type { CompileStage } from "../../lib/types";
import { motion } from "framer-motion";
import { CheckCircle2, CircleDashed, LoaderCircle, XCircle } from "lucide-react";

interface PipelineAnimationProps {
  stages: CompileStage[];
  type: "c" | "python";
}

const C_STAGES = ["Source Code", "Preprocessor", "Compiler", "Assembler", "Linker", "Executable"];
const PY_STAGES = ["Source Code", "Bytecode Compiler", "PVM", "Execution"];

const C_STAGE_KEYS: Record<string, string> = {
  source: "Source Code",
  preprocessor: "Preprocessor",
  compiler: "Compiler",
  assembler: "Assembler",
  linker: "Linker",
  execute: "Executable",
  executable: "Executable",
};

const PY_STAGE_KEYS: Record<string, string> = {
  source: "Source Code",
  bytecode: "Bytecode Compiler",
  compiler: "Bytecode Compiler",
  pvm: "PVM",
  output: "Execution",
  execution: "Execution",
};

const STATUS_NODE_STYLES: Record<string, string> = {
  pending: "border-ci-border bg-ci-panel/85 text-ci-dim",
  success: "border-ci-green/50 bg-ci-green/15 text-ci-green",
  error: "border-ci-red/50 bg-ci-red/15 text-ci-red",
  active: "border-ci-amber/55 bg-ci-amber/15 text-ci-amber",
};

function StatusIcon({ status, className }: { status: string; className?: string }) {
  if (status === "success") return <CheckCircle2 className={className} />;
  if (status === "error") return <XCircle className={className} />;
  if (status === "active") return <LoaderCircle className={`animate-spin ${className ?? ""}`} />;
  return <CircleDashed className={className} />;
}

export function PipelineAnimation({
  stages,
  type,
}: PipelineAnimationProps) {
  const labels = type === "c" ? C_STAGES : PY_STAGES;
  const nameMap = type === "c" ? C_STAGE_KEYS : PY_STAGE_KEYS;
  const title = type === "c" ? "Compilation" : "Interpretation";
  const accent = type === "c" ? "text-ci-amber" : "text-ci-blue";

  const normalizedByLabel = new Map<string, CompileStage>();
  for (const stage of stages) {
    const normalizedName = stage.name.toLowerCase();
    const canonicalLabel = nameMap[normalizedName];
    if (canonicalLabel) normalizedByLabel.set(canonicalLabel, stage);
  }

  if (!normalizedByLabel.has("Source Code") && stages.length > 0) {
    normalizedByLabel.set("Source Code", {
      name: "source",
      status: "success",
      output_preview: null,
      time_ms: 0,
      object_size: null,
      binary_size: null,
    });
  }

  const stageStates = labels.map((label) => {
    const stage = normalizedByLabel.get(label);
    const status = stage?.status ?? "pending";
    const isResolved = status !== "pending";
    return { label, stage, status, isResolved };
  });

  const resolvedCount = stageStates.filter((s) => s.isResolved).length;
  const latestResolvedIndex = Math.max(resolvedCount - 1, 0);
  const activeIndex = stageStates.findIndex((s) => s.status === "active");
  const focusIndex = activeIndex >= 0 ? activeIndex : latestResolvedIndex;
  const progressPercent =
    labels.length > 1 ? (Math.max(resolvedCount - 1, 0) / (labels.length - 1)) * 100 : 0;
  const progressColor = type === "c" ? "bg-ci-amber/70" : "bg-ci-blue/70";

  return (
    <div className="rounded-xl border border-ci-border bg-ci-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ci-muted">
          {title} Pipeline
        </h3>
        <span className={`text-[11px] font-mono uppercase tracking-wider ${accent}`}>
          {labels.length} stages
        </span>
      </div>
      <div className="relative overflow-x-auto pb-1 lg:overflow-visible">
        <div className="pointer-events-none absolute left-6 right-6 top-5 h-px bg-ci-border" />
        <motion.div
          className={`pointer-events-none absolute left-6 top-5 h-px ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 3rem) * ${progressPercent / 100})` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />

        <div className="flex min-w-[720px] items-start justify-between gap-3 px-1 lg:min-w-0 lg:gap-4">
          {stageStates.map(({ label, stage, status }, i) => {
            const nodeStyles = STATUS_NODE_STYLES[status] ?? STATUS_NODE_STYLES.pending;
            const isFocused = i === focusIndex && status !== "pending";

            return (
              <motion.div
                key={label}
                className="relative min-w-[100px] flex-1 text-center lg:min-w-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.24, ease: "easeOut" }}
              >
                <div className="mb-3 flex justify-center">
                  <motion.span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${nodeStyles}`}
                    animate={
                      isFocused
                        ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(0,0,0,0)", "0 0 20px rgba(56,189,248,0.18)", "0 0 0px rgba(0,0,0,0)"] }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={isFocused ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  >
                    <StatusIcon status={status} className="h-3.5 w-3.5" />
                  </motion.span>
                </div>
                <div className="text-[11px] font-mono text-ci-muted">{label}</div>
                <div className="mt-1 text-[10px] font-mono text-ci-dim/90">
                  {stage?.time_ms != null ? `${stage.time_ms.toFixed(1)}ms` : "waiting"}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
