import { useState } from "react";
import { useMemoryTrace } from "../../hooks/useMemoryTrace";
import { C_SNIPPETS, PY_SNIPPETS } from "../../lib/constants";
import type { TraceLanguage } from "../../lib/types";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { HeapColumn } from "./HeapColumn";
import { MemoryCodeEditor } from "./MemoryCodeEditor";
import { PointerArrow } from "./PointerArrow";
import { RefCountBadge } from "./RefCountBadge";
import { StackColumn } from "./StackColumn";
import { StepControls } from "./StepControls";

export function StackHeapVisualizer() {
  const [lang, setLang] = useState<TraceLanguage>("c");
  const [code, setCode] = useState(C_SNIPPETS[1].code);

  const {
    startTrace,
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-ci-border bg-ci-panel/80 p-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ci-muted">Memory backend</span>
          <span className={`rounded-full border px-2 py-0.5 ${
            backendStatus === "loading"
              ? "border-ci-blue/40 bg-ci-blue/15 text-ci-blue"
              : backendStatus === "ok"
                ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                : backendStatus === "error"
                  ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                  : "border-ci-border bg-ci-surface text-ci-dim"
          }`}>
            {backendStatus === "loading"
              ? "Tracing"
              : backendStatus === "ok"
                ? "Reachable"
                : backendStatus === "error"
                  ? "Issue detected"
                  : "Idle"}
          </span>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-ci-border">
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
          className="rounded-lg border border-ci-purple/30 bg-ci-purple/20 px-4 py-2 text-sm font-semibold text-ci-purple transition-colors duration-200 hover:bg-ci-purple/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-50"
        >
          {loading ? (
            <LoadingSpinner size="sm" color="border-ci-purple" />
          ) : (
            "Trace"
          )}
        </button>
      </div>

      {error && (
        <div className="text-sm text-ci-red bg-ci-red/10 rounded-lg p-3">
          <p>{error}</p>
          {errorHint && <p className="mt-1 text-xs text-ci-red/90">{errorHint}</p>}
        </div>
      )}

      {/* Code editor */}
      <MemoryCodeEditor
        code={code}
        onChange={setCode}
        currentLine={stepData?.line ?? null}
      />

      {/* Step controls */}
      {totalSteps > 0 && (
        <StepControls
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
      )}

      {/* Step description */}
      {stepData && (
        <div className="bg-ci-panel rounded-lg border border-ci-border p-3">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-ci-green">{stepData.action}</span>
            <span className="text-ci-text">{stepData.description}</span>
          </div>
        </div>
      )}

      {/* Memory visualization */}
      {stepData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-ci-panel rounded-xl border border-ci-border p-4">
            <StackColumn frames={stepData.stack} />
          </div>
          <div className="bg-ci-panel rounded-xl border border-ci-border p-4">
            <HeapColumn blocks={stepData.heap} />
            {/* Refcounts (Python) */}
            {stepData.refcounts && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(stepData.refcounts).map(([addr, count]) => (
                  <RefCountBadge key={addr} address={addr} count={count} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ci-border bg-ci-panel/60 p-5">
          <h4 className="text-sm font-medium text-ci-muted">Memory model preview</h4>
          <p className="mt-1 text-xs text-ci-dim">
            Click Trace to step through execution and watch stack frames, heap allocations, and pointers update in sync.
          </p>
        </div>
      )}

      {/* Pointer connections */}
      {pointerConnections.length > 0 && (
        <div className="bg-ci-panel rounded-lg border border-ci-border p-3">
          <h4 className="text-xs text-ci-muted mb-2">Pointer References</h4>
          <div className="flex flex-wrap gap-3">
            {pointerConnections.map((conn) => (
              <PointerArrow
                key={`${conn.from}-${conn.to}`}
                fromId={conn.from}
                toId={conn.to}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
