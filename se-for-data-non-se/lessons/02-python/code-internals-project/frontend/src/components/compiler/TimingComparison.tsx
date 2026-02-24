import type { CompileCResponse, InterpretPythonResponse } from "../../lib/types";

interface TimingComparisonProps {
  cResult: CompileCResponse | null;
  pyResult: InterpretPythonResponse | null;
  comparable: boolean;
  benchmarkMs: { cMs: number; pyMs: number } | null;
}

function formatKilobytes(valueKb: number | null | undefined): string {
  if (valueKb == null) return "N/A";
  const valueMb = valueKb / 1024;
  return `${valueKb} KB (${valueMb.toFixed(2)} MB)`;
}

function formatBytes(valueBytes: number | null | undefined): string {
  if (valueBytes == null) return "N/A";
  const valueKb = valueBytes / 1024;
  return `${valueBytes} B (${valueKb.toFixed(2)} KB)`;
}

export function TimingComparison({
  cResult,
  pyResult,
  comparable,
  benchmarkMs,
}: TimingComparisonProps) {
  if (!cResult && !pyResult) return null;

  const hasBoth = Boolean(cResult && pyResult);
  const cTime = comparable && benchmarkMs ? benchmarkMs.cMs : cResult?.exec_time_ms;
  const pyTime = comparable && benchmarkMs ? benchmarkMs.pyMs : pyResult?.exec_time_ms;

  let winner = "Run Both Benchmark to compare";
  if (comparable && hasBoth && cTime != null && pyTime != null) {
    winner = cTime === pyTime ? "Tie" : cTime < pyTime ? "C faster" : "Python faster";
  }

  const faster =
    comparable && hasBoth && cTime != null && pyTime != null
      ? cTime === pyTime
        ? null
        : cTime < pyTime
          ? "c"
          : "py"
      : null;

  const slowerMs =
    comparable && hasBoth && cTime != null && pyTime != null
      ? Math.max(cTime, pyTime)
      : null;
  const fasterMs =
    comparable && hasBoth && cTime != null && pyTime != null
      ? Math.min(cTime, pyTime)
      : null;

  const speedup =
    slowerMs != null && fasterMs != null && fasterMs > 0
      ? (slowerMs / fasterMs).toFixed(2)
      : null;

  const sizeMax = Math.max(cResult?.binary_size ?? 0, pyResult?.pyc_size ?? 0, 1);
  const cSizeWidth = ((cResult?.binary_size ?? 0) / sizeMax) * 100;
  const pySizeWidth = ((pyResult?.pyc_size ?? 0) / sizeMax) * 100;

  const cPeakMemory = cResult?.peak_rss_kb;
  const pyPeakMemory = pyResult?.peak_rss_kb;
  const hasMemoryMetrics = cPeakMemory != null || pyPeakMemory != null;
  const memoryMax = Math.max(cPeakMemory ?? 0, pyPeakMemory ?? 0, 1);
  const cMemoryWidth = cPeakMemory != null ? (cPeakMemory / memoryMax) * 100 : 0;
  const pyMemoryWidth = pyPeakMemory != null ? (pyPeakMemory / memoryMax) * 100 : 0;

  return (
    <div className="space-y-4 rounded-xl border border-ci-border bg-ci-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ci-muted">Performance Comparison</h3>
        <span className="rounded-full border border-ci-border bg-ci-surface/65 px-2.5 py-0.5 text-[11px] font-mono text-ci-dim">{winner}</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs text-ci-dim">Execution Time (ms)</div>
            <span className="text-[11px] font-mono text-ci-dim">lower is better</span>
          </div>

          <div className="mb-2 text-[11px] text-ci-dim">
            {comparable && benchmarkMs
              ? "Benchmark mode: runtime-only timing on matched workload (same run round)."
              : "Runtime metrics from language-specific instrumentation."}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={`rounded-lg border p-3 ${faster === "c" ? "border-ci-amber/50 bg-ci-amber/12" : "border-ci-border bg-ci-surface/45"}`}>
              <div className="text-xs text-ci-dim">C runtime</div>
              <div className="mt-1 text-lg font-mono text-ci-amber">{cTime != null ? `${cTime.toFixed(2)} ms` : "-"}</div>
            </div>
            <div className={`rounded-lg border p-3 ${faster === "py" ? "border-ci-blue/50 bg-ci-blue/12" : "border-ci-border bg-ci-surface/45"}`}>
              <div className="text-xs text-ci-dim">Python runtime</div>
              <div className="mt-1 text-lg font-mono text-ci-blue">{pyTime != null ? `${pyTime.toFixed(2)} ms` : "-"}</div>
            </div>
          </div>

          {comparable && hasBoth && speedup ? (
            <div className="mt-2 text-xs text-ci-text">
              <span className="font-medium">Speed ratio:</span>{" "}
              <span className="font-mono">{speedup}x</span>{" "}
              <span className="text-ci-dim">({faster === "c" ? "C" : "Python"} faster than {faster === "c" ? "Python" : "C"})</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-ci-dim">
              Run `Run Both Benchmark` to avoid mixed-round comparisons.
            </div>
          )}
        </div>

        {cResult && (
          <div>
            <div className="mb-1 text-xs text-ci-dim">
              Compile Time (C only)
            </div>
            <div className="text-sm font-mono text-ci-amber">
              {cResult.compile_time_ms.toFixed(1)} ms
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs text-ci-dim">Peak Process Memory (KB)</div>
          <div className="mb-2 text-[11px] text-ci-dim">
            Compare memory only within this section. These values represent runtime RAM peak.
          </div>
          {hasMemoryMetrics ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-xs text-ci-muted">C process</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-ci-surface">
                  <div className="h-full rounded bg-ci-amber transition-all duration-500" style={{ width: `${cMemoryWidth}%` }} />
                </div>
                <span className="w-44 text-xs font-mono text-ci-text">{formatKilobytes(cPeakMemory)}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-xs text-ci-muted">Py process</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-ci-surface">
                  <div className="h-full rounded bg-ci-blue transition-all duration-500" style={{ width: `${pyMemoryWidth}%` }} />
                </div>
                <span className="w-44 text-xs font-mono text-ci-text">{formatKilobytes(pyPeakMemory)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ci-dim">Peak process memory is unavailable for this run.</p>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs text-ci-dim">Artifact Size (not RAM)</div>
          <div className="mb-2 text-[11px] text-ci-dim">
            This is generated file size on disk. Do not compare directly against process memory.
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-20 text-right text-xs text-ci-muted">C binary</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-ci-surface">
                <div className="h-full rounded bg-ci-amber/80 transition-all duration-500" style={{ width: `${cSizeWidth}%` }} />
              </div>
              <span className="w-44 text-xs font-mono text-ci-text">{formatBytes(cResult?.binary_size)}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-right text-xs text-ci-muted">Py bytecode</span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-ci-surface">
                <div className="h-full rounded bg-ci-blue/80 transition-all duration-500" style={{ width: `${pySizeWidth}%` }} />
              </div>
              <span className="w-44 text-xs font-mono text-ci-text">{formatBytes(pyResult?.pyc_size)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
