import type { BytesCompareResponse } from "../../lib/types";
import { CompareBar } from "../shared/CompareBar";

interface SizeCompareProps {
  result: BytesCompareResponse;
}

export function SizeCompare({ result }: SizeCompareProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-ci-muted">
        Memory Size Comparison
      </h3>

      <CompareBar
        leftValue={result.c_size}
        rightValue={result.py_size}
        leftLabel={`C (${result.c_type})`}
        rightLabel={`Py (${result.py_type})`}
        leftColor="bg-ci-amber"
        rightColor="bg-ci-purple"
      />

      <div className="text-xs text-ci-muted">
        Python overhead:{" "}
        <span className="text-ci-purple font-mono">
          {result.py_size - result.c_size} bytes
        </span>{" "}
        ({result.c_size > 0 ? ((result.py_size / result.c_size) * 100).toFixed(0) : "N/A"}% of C size)
      </div>

      {Object.entries(result.details).map(([key, detail]) => (
        <div
          key={key}
          className="p-3 bg-ci-surface rounded border border-ci-border text-xs"
        >
          <div className="font-medium text-ci-text mb-1">{key}</div>
          <div className="text-ci-muted">
            Base: {detail.base_size}B | Overhead: {detail.overhead}
          </div>
          {detail.components.length > 0 && (
            <div className="mt-1 text-ci-dim">
              Components: {detail.components.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
