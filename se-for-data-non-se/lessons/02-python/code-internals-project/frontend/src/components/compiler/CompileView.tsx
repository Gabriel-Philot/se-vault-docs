import { useMemo, useState } from "react";
import { useCompile } from "../../hooks/useCompile";
import { C_SNIPPETS, PY_SNIPPETS } from "../../lib/constants";
import type { CompileStage } from "../../lib/types";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { GlassPanel } from "../shared/GlassPanel";
import { PageTitleBlock } from "../shared/PageTitleBlock";
import { AssemblyView } from "./AssemblyView";
import { BytecodeView } from "./BytecodeView";
import { CodeEditor } from "./CodeEditor";
import { PipelineAnimation } from "./PipelineAnimation";
import { SnippetSelector } from "./SnippetSelector";
import { TimingComparison } from "./TimingComparison";

const BENCHMARK_C_CODE = `#include <stdio.h>

long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    volatile long sink = 0;
    for (int i = 0; i < 4; i++) {
        sink += fib(32);
    }
    if (sink == -1) {
        printf("%ld\\n", sink);
    }
    return 0;
}`;

const BENCHMARK_PY_CODE = `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

sink = 0
for _ in range(4):
    sink += fib(32)

if sink == -1:
    print(sink)`;

export function CompileView() {
  const [activeTab, setActiveTab] = useState<"c" | "python">("c");
  const [cCode, setCCode] = useState(C_SNIPPETS[0].code);
  const [pyCode, setPyCode] = useState(PY_SNIPPETS[0].code);
  const [optimization, setOptimization] = useState("-O0");
  const [comparisonSynced, setComparisonSynced] = useState(false);
  const [benchmarkMs, setBenchmarkMs] = useState<{ cMs: number; pyMs: number } | null>(null);
  const {
    compileC,
    interpretPython,
    cResult,
    pyResult,
    loading,
    error,
    errorHint,
    backendStatus,
  } = useCompile();

  const normalizedStages = useMemo(() => {
    if (!cResult) return [];
    return cResult.stages.map((stage) => ({ ...stage, name: stage.name.toLowerCase() }));
  }, [cResult]);

  const assemblyOutput = useMemo(() => {
    const compilerStage = normalizedStages.find((stage) => stage.name === "compiler");
    if (compilerStage?.output_preview) return compilerStage.output_preview;

    const assemblerStage = normalizedStages.find((stage) => stage.name === "assembler");
    return assemblerStage?.output_preview ?? null;
  }, [normalizedStages]);

  const cPipelineStages = useMemo(() => {
    if (!cResult) return [];
    const executeStage: CompileStage = {
      name: "execute",
      status: "success",
      output_preview: null,
      time_ms: cResult.exec_time_ms,
      object_size: null,
      binary_size: null,
    };
    return [...normalizedStages, executeStage];
  }, [cResult, normalizedStages]);

  const pyPipelineStages = useMemo<CompileStage[]>(() => {
    if (!pyResult) return [];
    return [
      { name: "source", status: "success", output_preview: null, time_ms: 0, object_size: null, binary_size: null },
      { name: "bytecode", status: "success", output_preview: null, time_ms: 0, object_size: null, binary_size: null },
      { name: "pvm", status: "success", output_preview: null, time_ms: pyResult.exec_time_ms, object_size: null, binary_size: null },
      { name: "output", status: pyResult.error ? "error" : "success", output_preview: pyResult.error, time_ms: 0, object_size: null, binary_size: null },
    ];
  }, [pyResult]);

  const hasResults = Boolean(cResult || pyResult);
  const activeAccent = activeTab === "c" ? "amber" : "blue";
  const activeCode = activeTab === "c" ? cCode : pyCode;
  const activeSnippets = activeTab === "c" ? C_SNIPPETS : PY_SNIPPETS;
  const activeIsLoading = loading;

  const backendLabel =
    backendStatus === "loading"
      ? "Processing"
      : backendStatus === "ok"
        ? "Reachable"
        : backendStatus === "error"
          ? "Issue detected"
          : "Idle";

  const runLabel = activeTab === "c" ? "Compile" : "Interpret";

  const runActive = async () => {
    setComparisonSynced(false);
    setBenchmarkMs(null);
    if (activeTab === "c") {
      await compileC(cCode, optimization);
      return;
    }
    await interpretPython(pyCode);
  };

  const runBothBenchmark = async () => {
    setComparisonSynced(false);
    const cRun = await compileC(BENCHMARK_C_CODE, "-O2");
    const pyRun = await interpretPython(BENCHMARK_PY_CODE);
    if (cRun.ok && pyRun.ok) {
      setBenchmarkMs({
        cMs: cRun.result?.exec_time_ms ?? cRun.elapsedMs,
        pyMs: pyRun.result?.exec_time_ms ?? pyRun.elapsedMs,
      });
      setComparisonSynced(true);
      return;
    }
    setBenchmarkMs(null);
  };

  return (
    <div className="space-y-6">
      <PageTitleBlock
        eyebrow="Panel 03"
        title="Compiled vs Interpreted"
        subtitle="Run real C and Python execution, inspect each stage, and compare runtime behavior without fake pipeline data."
        accent="amber"
      />

      <GlassPanel accent="amber" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-ci-border bg-ci-surface/70 p-1">
            <button
              onClick={() => setActiveTab("c")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "c"
                  ? "border border-ci-amber/45 bg-ci-amber/20 text-ci-amber"
                  : "text-ci-dim hover:text-ci-text"
              }`}
            >
              C Pipeline
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "python"
                  ? "border border-ci-blue/45 bg-ci-blue/20 text-ci-blue"
                  : "text-ci-dim hover:text-ci-text"
              }`}
            >
              Python VM
            </button>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-ci-border bg-ci-surface/70 px-3 py-1.5 text-xs">
            <span className="text-ci-muted">Backend</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                backendStatus === "loading"
                  ? "border-ci-blue/40 bg-ci-blue/15 text-ci-blue"
                  : backendStatus === "ok"
                    ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
                    : backendStatus === "error"
                      ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
                      : "border-ci-border bg-ci-panel text-ci-dim"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {backendLabel}
            </span>
          </div>
        </div>
      </GlassPanel>

      {error && (
        <div className="rounded-xl border border-ci-red/35 bg-ci-red/10 p-3 text-sm text-ci-red">
          <p>{error}</p>
          {errorHint && <p className="mt-1 text-xs text-ci-red/90">{errorHint}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <GlassPanel accent={activeAccent} className="space-y-4 p-4 sm:p-5 xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-ci-dim">
                {activeTab === "c" ? "Compiled" : "Interpreted"}
              </p>
              <h2 className={`mt-1 text-lg font-semibold ${activeTab === "c" ? "text-ci-amber" : "text-ci-blue"}`}>
                {activeTab === "c" ? "C" : "Python"}
              </h2>
            </div>

            {activeTab === "c" ? (
              <select
                value={optimization}
                onChange={(e) => setOptimization(e.target.value)}
                aria-label="C optimization level"
                className="rounded-md border border-ci-border bg-ci-surface px-2.5 py-1.5 text-xs text-ci-text transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-amber/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
              >
                <option value="-O0">O0 (debug)</option>
                <option value="-O1">O1</option>
                <option value="-O2">O2</option>
                <option value="-O3">O3</option>
              </select>
            ) : null}
          </div>

          <SnippetSelector
            snippets={activeSnippets}
            onSelect={activeTab === "c" ? setCCode : setPyCode}
            language={activeTab}
            selectedCode={activeCode}
          />

          <CodeEditor
            code={activeCode}
            onChange={activeTab === "c" ? setCCode : setPyCode}
            language={activeTab}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={runActive}
              disabled={activeIsLoading}
              className={`w-full rounded-md border px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-60 ${
                activeTab === "c"
                  ? "border-ci-amber/45 bg-ci-amber/20 text-ci-amber hover:bg-ci-amber/30 hover:shadow-[0_0_18px_rgba(251,191,36,0.18)] focus-visible:ring-ci-amber/60"
                  : "border-ci-blue/45 bg-ci-blue/20 text-ci-blue hover:bg-ci-blue/30 hover:shadow-[0_0_18px_rgba(56,189,248,0.18)] focus-visible:ring-ci-blue/60"
              }`}
            >
              {activeIsLoading ? (
                <LoadingSpinner size="sm" color={activeTab === "c" ? "border-ci-amber" : "border-ci-blue"} />
              ) : (
                runLabel
              )}
            </button>

            <button
              onClick={runBothBenchmark}
              disabled={activeIsLoading}
              className="w-full rounded-md border border-ci-cyan/45 bg-ci-cyan/15 px-4 py-2 text-sm font-semibold text-ci-cyan transition-all duration-200 hover:bg-ci-cyan/25 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-60"
            >
              Run Both Benchmark
            </button>
          </div>

          <p className="text-[11px] text-ci-dim">
            Benchmark uses fixed workload `fib(32)` x4 and C `-O2` to avoid misleading tiny-snippet comparisons.
          </p>
        </GlassPanel>

        <GlassPanel accent={activeAccent} className="space-y-4 p-4 sm:p-5 xl:col-span-8">
          {!hasResults ? (
            <div className="rounded-xl border border-dashed border-ci-border bg-ci-panel/60 p-5">
              <h3 className="text-sm font-medium text-ci-muted">Pipeline preview</h3>
              <p className="mt-1 text-xs text-ci-dim">
                Run Compile or Interpret to inspect each stage and execution output.
              </p>
            </div>
          ) : activeTab === "c" && cResult ? (
            <PipelineAnimation stages={cPipelineStages} type="c" />
          ) : activeTab === "python" && pyResult ? (
            <PipelineAnimation stages={pyPipelineStages} type="python" />
          ) : (
            <div className="rounded-xl border border-dashed border-ci-border bg-ci-panel/60 p-5">
              <h3 className="text-sm font-medium text-ci-muted">Waiting for {activeTab === "c" ? "C" : "Python"} run</h3>
              <p className="mt-1 text-xs text-ci-dim">Execute the current tab to populate pipeline data.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-ci-border bg-ci-panel p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ci-amber">C Output</h3>
                <span className="text-[10px] font-mono text-ci-dim">stdout</span>
              </div>
              {cResult ? (
                <pre className="max-h-32 overflow-auto rounded-md border border-ci-border/60 bg-ci-surface/50 p-2.5 text-xs font-mono text-ci-text whitespace-pre-wrap">
                  {cResult.output || "(no stdout)"}
                </pre>
              ) : (
                <p className="text-xs text-ci-dim">Compile C code to populate output.</p>
              )}
            </div>

            <div className="rounded-xl border border-ci-border bg-ci-panel p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ci-blue">Python Output</h3>
                <span className="text-[10px] font-mono text-ci-dim">stdout / error</span>
              </div>
              {pyResult ? (
                <>
                  <pre className="max-h-24 overflow-auto rounded-md border border-ci-border/60 bg-ci-surface/50 p-2.5 text-xs font-mono text-ci-text whitespace-pre-wrap">
                    {pyResult.output || "(no stdout)"}
                  </pre>
                  {pyResult.error ? (
                    <pre className="mt-2 max-h-20 overflow-auto rounded-md border border-ci-red/35 bg-ci-red/10 p-2.5 text-xs font-mono text-ci-red whitespace-pre-wrap">
                      {pyResult.error}
                    </pre>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-ci-dim">Interpret Python code to populate output.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AssemblyView assembly={assemblyOutput} />
            {pyResult ? (
              <BytecodeView opcodes={pyResult.opcodes} bytecodeRaw={pyResult.bytecode_raw} />
            ) : (
              <div className="rounded-xl border border-ci-border bg-ci-panel p-4 sm:p-5">
                <h3 className="mb-2 text-sm font-medium text-ci-muted">Python Bytecode</h3>
                <p className="text-xs text-ci-dim">Interpret Python code to inspect generated opcodes and raw bytecode output.</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      <TimingComparison cResult={cResult} pyResult={pyResult} comparable={comparisonSynced} benchmarkMs={benchmarkMs} />
    </div>
  );
}
