import type { CompileCResponse, InterpretPythonResponse } from "../../lib/types";
import { CompareBar } from "../shared/CompareBar";

interface TimingComparisonProps {
  cResult: CompileCResponse | null;
  pyResult: InterpretPythonResponse | null;
}

export function TimingComparison({
  cResult,
  pyResult,
}: TimingComparisonProps) {
  if (!cResult && !pyResult) return null;

  return (
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4 space-y-4">
      <h3 className="text-sm font-medium text-ci-muted">
        Performance Comparison
      </h3>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-ci-dim mb-1">Execution Time (ms)</div>
          <CompareBar
            leftValue={cResult?.exec_time_ms ?? 0}
            rightValue={pyResult?.exec_time_ms ?? 0}
            leftLabel="C"
            rightLabel="Python"
            leftColor="bg-ci-amber"
            rightColor="bg-ci-blue"
            unit="ms"
          />
        </div>

        {cResult && (
          <div>
            <div className="text-xs text-ci-dim mb-1">
              Compile Time (C only)
            </div>
            <div className="text-sm font-mono text-ci-amber">
              {cResult.compile_time_ms.toFixed(1)} ms
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-ci-dim mb-1">
            Binary / Bytecode Size
          </div>
          <CompareBar
            leftValue={cResult?.binary_size ?? 0}
            rightValue={pyResult?.pyc_size ?? 0}
            leftLabel="C binary"
            rightLabel="Py .pyc"
            leftColor="bg-ci-amber"
            rightColor="bg-ci-blue"
          />
        </div>
      </div>
    </div>
  );
}
