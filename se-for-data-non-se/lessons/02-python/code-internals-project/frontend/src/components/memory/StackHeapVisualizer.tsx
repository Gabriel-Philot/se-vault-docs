import { useEffect, useState } from "react";
import { useMemoryTrace } from "../../hooks/useMemoryTrace";
import { C_SNIPPETS, PY_SNIPPETS } from "../../lib/constants";
import type { HeapBlock, TraceLanguage } from "../../lib/types";
import { GlassPanel } from "../shared/GlassPanel";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { PageTitleBlock } from "../shared/PageTitleBlock";
import { HeapColumn } from "./HeapColumn";
import { MemoryCodeEditor } from "./MemoryCodeEditor";
import { PointerArrow } from "./PointerArrow";
import { RefCountBadge } from "./RefCountBadge";
import { StackColumn } from "./StackColumn";
import { StepControls } from "./StepControls";

interface PlannedHeapSlot {
  name: string;
  allocLine: number;
  freeLine: number | null;
}

function planCHeapSlots(source: string): PlannedHeapSlot[] {
  const lines = source.split("\n");
  const slots: PlannedHeapSlot[] = [];

  lines.forEach((line, idx) => {
    const alloc = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*malloc\s*\(/);
    if (alloc) {
      slots.push({ name: alloc[1], allocLine: idx + 1, freeLine: null });
      return;
    }

    const free = line.match(/free\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
    if (free) {
      const slot = slots.find((s) => s.name === free[1] && s.freeLine === null);
      if (slot) slot.freeLine = idx + 1;
    }
  });

  return slots;
}

export function StackHeapVisualizer() {
  const [lang, setLang] = useState<TraceLanguage>("c");
  const [code, setCode] = useState(C_SNIPPETS[1].code);
  const [executionLog, setExecutionLog] = useState<Array<{ key: string; label: string }>>([]);

  const {
    startTrace,
    sessionId,
    totalSteps,
    currentStep,
    stepData,
    isPlaying,
    speed,
    loading,
    error,
    errorHint,
    backendStatus,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    setSpeed,
  } = useMemoryTrace();

  const handleLangSwitch = (newLang: TraceLanguage) => {
    setLang(newLang);
    setCode(newLang === "c" ? C_SNIPPETS[1].code : PY_SNIPPETS[1].code);
  };

  // Find pointer connections
  const pointerConnections = stepData
    ? stepData.stack.flatMap((frame) =>
        frame.variables
          .filter((v) => v.points_to_heap)
          .map((v) => ({
            from: `${frame.function}::${v.name}`,
            to: v.value,
          }))
      )
    : [];

  const plannedHeapSlots = lang === "c" ? planCHeapSlots(code) : [];

  const codeInferredHeapBlocks: HeapBlock[] = stepData
    ? plannedHeapSlots
        .filter((slot) => {
          const line = stepData.line ?? 0;
          const allocated = line >= slot.allocLine;
          const stillAlive = slot.freeLine === null || line < slot.freeLine;
          return allocated && stillAlive;
        })
        .map((_, idx) => ({
          address: `0x${(0x2000 + idx * 0x100).toString(16)}`,
          size: 40,
          type: "dynamic",
          status: "allocated",
          allocated_by: "main",
        }))
    : [];

  const inferredHeapBlocks: HeapBlock[] = stepData
    ? stepData.stack.flatMap((frame) =>
        frame.variables
          .filter((variable) => variable.points_to_heap)
          .map((variable, idx) => ({
            address: `heap:${frame.function}.${variable.name}.${idx}`,
            size: 40,
            type: variable.type,
            status: stepData.action.includes("free") ? "freed" : "allocated",
            allocated_by: frame.function,
          }))
      )
    : [];

  const isFreeLikeStep = Boolean(
    stepData &&
      (stepData.action.toLowerCase().includes("free") ||
        /free\s*\(/i.test(stepData.description))
  );

  const freedStepFromHistory = executionLog.reduce<number | null>((acc, entry) => {
    const match = entry.label.match(/^Step\s+(\d+):\s+heap_free\b/i);
    if (!match) return acc;
    const stepIndex = Number(match[1]) - 1;
    if (Number.isNaN(stepIndex)) return acc;
    if (acc === null) return stepIndex;
    return Math.min(acc, stepIndex);
  }, null);

  const canInferHeapForStep = Boolean(
    stepData &&
      (inferredHeapBlocks.length > 0 || codeInferredHeapBlocks.length > 0) &&
      !isFreeLikeStep &&
      (freedStepFromHistory === null || stepData.step < freedStepFromHistory)
  );

  const usingInferredHeap = Boolean(
    stepData && stepData.heap.length === 0 && canInferHeapForStep
  );

  const heapBlocksForView = stepData
    ? stepData.heap.length > 0
      ? stepData.heap
      : canInferHeapForStep
        ? inferredHeapBlocks.length > 0
          ? inferredHeapBlocks
          : codeInferredHeapBlocks
        : []
    : [];

  const hasTrace = Boolean(sessionId && totalSteps > 0);
  const hasPointerConnections = pointerConnections.length > 0;

  const codePointerConnections = stepData
    ? plannedHeapSlots
        .filter((slot) => {
          const line = stepData.line ?? 0;
          const allocated = line >= slot.allocLine;
          const stillAlive = slot.freeLine === null || line < slot.freeLine;
          return allocated && stillAlive;
        })
        .map((slot, idx) => ({
          from: `main::${slot.name}`,
          to: `0x${(0x2000 + idx * 0x100).toString(16)}`,
        }))
    : [];

  const pointerConnectionsForView = hasPointerConnections
    ? pointerConnections
    : codePointerConnections;

  useEffect(() => {
    setExecutionLog([]);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !stepData) return;
    const key = `${sessionId}-${stepData.step}-${stepData.action}-${stepData.description}`;
    const label = `Step ${stepData.step + 1}: ${stepData.action} - ${stepData.description}`;

    setExecutionLog((prev) => {
      if (prev.some((entry) => entry.key === key)) return prev;
      const next = [...prev, { key, label }];
      return next.slice(-12);
    });
  }, [sessionId, stepData]);

  return (
    <div className="space-y-4">
      <PageTitleBlock
        eyebrow="Panel 04"
        title="Stack vs Heap Visualizer"
        subtitle="Trace real execution to inspect stack frames, heap blocks, and references over time."
        accent="blue"
      />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <GlassPanel accent="blue" className="space-y-4 p-4 lg:col-span-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ci-muted">Memory backend</span>
              <span
                className={`rounded-full border px-2 py-0.5 ${
                  backendStatus === "loading"
                    ? "border-ci-blue/40 bg-ci-blue/15 text-ci-blue"
                    : backendStatus === "ok"
                      ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                      : backendStatus === "error"
                        ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                        : "border-ci-border bg-ci-surface text-ci-dim"
                }`}
              >
                {backendStatus === "loading"
                  ? "Tracing"
                  : backendStatus === "ok"
                    ? "Reachable"
                    : backendStatus === "error"
                      ? "Issue detected"
                      : "Idle"}
              </span>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-ci-border/90 bg-ci-bg/50">
              <button
                onClick={() => handleLangSwitch("c")}
                className={`px-4 py-2 text-sm font-mono transition-colors duration-200 ${
                  lang === "c"
                    ? "bg-ci-amber/20 text-ci-amber"
                    : "bg-ci-surface text-ci-muted hover:text-ci-text"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-amber/60 focus-visible:ring-inset`}
                aria-pressed={lang === "c"}
              >
                C
              </button>
              <button
                onClick={() => handleLangSwitch("python")}
                className={`px-4 py-2 text-sm font-mono transition-colors duration-200 ${
                  lang === "python"
                    ? "bg-ci-blue/20 text-ci-blue"
                    : "bg-ci-surface text-ci-muted hover:text-ci-text"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/60 focus-visible:ring-inset`}
                aria-pressed={lang === "python"}
              >
                Python
              </button>
            </div>
            <button
              onClick={() => startTrace(code, lang)}
              disabled={loading}
              className="rounded-lg border border-ci-blue/35 bg-ci-blue/15 px-4 py-2 text-sm font-semibold text-ci-blue transition-all duration-200 hover:translate-y-[-1px] hover:bg-ci-blue/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" color="border-ci-blue" /> : "Trace"}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-ci-red/35 bg-ci-red/10 p-3 text-sm text-ci-red">
              <p>{error}</p>
              {errorHint ? <p className="mt-1 text-xs text-ci-red/90">{errorHint}</p> : null}
            </div>
          )}

          <StepControls
            hasTrace={hasTrace}
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onStepForward={stepForward}
            onStepBack={stepBack}
            onReset={reset}
            onSpeedChange={setSpeed}
          />

          <MemoryCodeEditor code={code} onChange={setCode} currentLine={stepData?.line ?? null} />
        </GlassPanel>

        <div className="flex h-full flex-col gap-4 lg:col-span-1">
          {stepData ? (
            <GlassPanel accent="blue" className="p-3">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="rounded-full border border-ci-green/35 bg-ci-green/10 px-2 py-0.5 text-ci-green">
                  {stepData.action}
                </span>
                <span className="text-ci-text/95">{stepData.description}</span>
              </div>
            </GlassPanel>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <GlassPanel accent="blue" className="p-4">
              <StackColumn frames={stepData?.stack ?? []} />
            </GlassPanel>

            <GlassPanel accent="cyan" className="p-4">
              <HeapColumn blocks={heapBlocksForView} />
              {usingInferredHeap ? (
                <p className="mt-2 text-[11px] font-mono text-ci-dim">
                  Heap blocks inferred from pointer references (backend returned empty heap metadata).
                </p>
              ) : null}
              {stepData?.refcounts ? (
                <div className="mt-3 rounded-lg border border-ci-border/70 bg-ci-bg/25 p-2">
                  <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ci-muted">
                    Reference Counts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stepData.refcounts).map(([addr, count]) => (
                      <RefCountBadge key={addr} address={addr} count={count} />
                    ))}
                  </div>
                </div>
              ) : null}
            </GlassPanel>
          </div>

          {pointerConnectionsForView.length > 0 ? (
            <GlassPanel accent="cyan" className="p-3">
              <h4 className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-ci-muted">Pointer References</h4>
              <div className="flex flex-wrap gap-3">
                {pointerConnectionsForView.map((conn) => (
                  <PointerArrow key={`${conn.from}-${conn.to}`} fromId={conn.from} toId={conn.to} />
                ))}
              </div>
            </GlassPanel>
          ) : null}

          <GlassPanel accent="green" className="flex min-h-[280px] flex-1 flex-col p-3">
            <h4 className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-ci-muted">Execution Log</h4>
            {executionLog.length === 0 ? (
              <p className="text-xs text-ci-dim">No trace executed yet. Run Trace to keep a step-by-step record here.</p>
            ) : (
              <ul className="flex-1 space-y-1.5 overflow-auto pr-1 text-xs font-mono text-ci-text/90">
                {executionLog.map((entry) => (
                  <li key={entry.key} className="rounded-md border border-ci-border/70 bg-ci-bg/30 px-2 py-1.5">
                    {entry.label}
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
