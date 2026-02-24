import { useMemo, useState } from "react";
import { useCompile } from "../../hooks/useCompile";
import { C_SNIPPETS, PY_SNIPPETS } from "../../lib/constants";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { AssemblyView } from "./AssemblyView";
import { BytecodeView } from "./BytecodeView";
import { CodeEditor } from "./CodeEditor";
import { PipelineAnimation } from "./PipelineAnimation";
import { SnippetSelector } from "./SnippetSelector";
import { TimingComparison } from "./TimingComparison";

export function CompileView() {
  const [cCode, setCCode] = useState(C_SNIPPETS[0].code);
  const [pyCode, setPyCode] = useState(PY_SNIPPETS[0].code);
  const [optimization, setOptimization] = useState("-O0");
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

  const assemblyOutput = useMemo(() => {
    if (!cResult) return null;
    const asmStage = cResult.stages.find((s) => s.name === "Compiler" || s.name === "Assembler");
    return asmStage?.output_preview ?? null;
  }, [cResult]);

  const hasResults = Boolean(cResult || pyResult);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ci-muted">Compiler backend</span>
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
            ? "Processing"
            : backendStatus === "ok"
              ? "Reachable"
              : backendStatus === "error"
                ? "Issue detected"
                : "Idle"}
        </span>
      </div>
      {error && (
        <div className="text-sm text-ci-red bg-ci-red/10 rounded-lg p-3">
          <p>{error}</p>
          {errorHint && <p className="mt-1 text-xs text-ci-red/90">{errorHint}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* C side */}
        <section className="space-y-3 rounded-xl border border-ci-border bg-ci-panel/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ci-amber">C</h2>
            <div className="flex items-center gap-2">
              <select
                value={optimization}
                onChange={(e) => setOptimization(e.target.value)}
                aria-label="C optimization level"
                className="rounded-md border border-ci-border bg-ci-surface px-2.5 py-1.5 text-xs text-ci-text transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-amber/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
              >
                <option value="-O0">-O0</option>
                <option value="-O1">-O1</option>
                <option value="-O2">-O2</option>
                <option value="-O3">-O3</option>
              </select>
              <button
                onClick={() => compileC(cCode, optimization)}
                disabled={loading}
                className="rounded-md border border-ci-amber/40 bg-ci-amber/20 px-4 py-1.5 text-sm font-semibold text-ci-amber transition-colors duration-200 hover:bg-ci-amber/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-amber/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="border-ci-amber" />
                ) : (
                  "Compile"
                )}
              </button>
            </div>
          </div>
          <SnippetSelector
            snippets={C_SNIPPETS}
            onSelect={setCCode}
            language="c"
          />
          <CodeEditor code={cCode} onChange={setCCode} language="c" />
        </section>

        {/* Python side */}
        <section className="space-y-3 rounded-xl border border-ci-border bg-ci-panel/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ci-blue">Python</h2>
            <button
              onClick={() => interpretPython(pyCode)}
              disabled={loading}
              className="rounded-md border border-ci-blue/40 bg-ci-blue/20 px-4 py-1.5 text-sm font-semibold text-ci-blue transition-colors duration-200 hover:bg-ci-blue/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="border-ci-blue" />
              ) : (
                "Interpret"
              )}
            </button>
          </div>
          <SnippetSelector
            snippets={PY_SNIPPETS}
            onSelect={setPyCode}
            language="python"
          />
          <CodeEditor code={pyCode} onChange={setPyCode} language="python" />
        </section>
      </div>

      {hasResults ? (
        <div className="space-y-4">
          {cResult && <PipelineAnimation stages={cResult.stages} type="c" />}
          {pyResult && (
            <PipelineAnimation
              stages={[
                { name: "Source", status: "success", output_preview: null, time_ms: 0, object_size: null, binary_size: null },
                { name: "Bytecode", status: "success", output_preview: null, time_ms: 0, object_size: null, binary_size: null },
                { name: "PVM", status: "success", output_preview: null, time_ms: pyResult.exec_time_ms, object_size: null, binary_size: null },
                { name: "Output", status: "success", output_preview: null, time_ms: 0, object_size: null, binary_size: null },
              ]}
              type="python"
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ci-border bg-ci-panel/60 p-5">
          <h3 className="text-sm font-medium text-ci-muted">Pipeline preview</h3>
          <p className="mt-1 text-xs text-ci-dim">
            Run Compile or Interpret to see each language stage and timing breakdown.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssemblyView assembly={assemblyOutput} />
        {pyResult ? (
          <BytecodeView
            opcodes={pyResult.opcodes}
            bytecodeRaw={pyResult.bytecode_raw}
          />
        ) : (
          <div className="rounded-xl border border-ci-border bg-ci-panel p-4">
            <h3 className="mb-2 text-sm font-medium text-ci-muted">Python Bytecode</h3>
            <p className="text-xs text-ci-dim">
              Interpret Python code to inspect generated opcodes and raw bytecode output.
            </p>
          </div>
        )}
      </div>

      {/* Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cResult ? (
          <div className="bg-ci-panel rounded-lg border border-ci-border p-4">
            <h3 className="text-sm font-medium text-ci-muted mb-2">
              C Output
            </h3>
            <pre className="text-xs font-mono text-ci-text whitespace-pre-wrap">
              {cResult.output}
            </pre>
          </div>
        ) : (
          <div className="rounded-lg border border-ci-border bg-ci-panel/80 p-4">
            <h3 className="mb-2 text-sm font-medium text-ci-muted">C Output</h3>
            <p className="text-xs text-ci-dim">Compile C code to populate runtime output.</p>
          </div>
        )}
        {pyResult ? (
          <div className="bg-ci-panel rounded-lg border border-ci-border p-4">
            <h3 className="text-sm font-medium text-ci-muted mb-2">
              Python Output
            </h3>
            <pre className="text-xs font-mono text-ci-text whitespace-pre-wrap">
              {pyResult.output}
            </pre>
            {pyResult.error && (
              <pre className="text-xs font-mono text-ci-red mt-2 whitespace-pre-wrap">
                {pyResult.error}
              </pre>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-ci-border bg-ci-panel/80 p-4">
            <h3 className="mb-2 text-sm font-medium text-ci-muted">Python Output</h3>
            <p className="text-xs text-ci-dim">Interpret Python code to view stdout and errors.</p>
          </div>
        )}
      </div>

      <TimingComparison cResult={cResult} pyResult={pyResult} />
    </div>
  );
}
