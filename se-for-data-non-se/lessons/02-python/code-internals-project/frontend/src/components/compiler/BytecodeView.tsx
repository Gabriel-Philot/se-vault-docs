import { useState } from "react";
import type { Opcode } from "../../lib/types";

interface BytecodeViewProps {
  opcodes: Opcode[];
  bytecodeRaw: string;
}

export function BytecodeView({ opcodes, bytecodeRaw }: BytecodeViewProps) {
  const [showRaw, setShowRaw] = useState(false);
  const hasBytecode = opcodes.length > 0 || bytecodeRaw.trim().length > 0;

  return (
    <div className="bg-ci-panel rounded-xl border border-ci-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-ci-muted">
          Python Bytecode
        </h3>
        <button
          onClick={() => setShowRaw(!showRaw)}
          aria-pressed={showRaw}
          className="rounded-md border border-ci-blue/40 bg-ci-blue/10 px-2.5 py-1 text-xs font-medium text-ci-blue transition-colors duration-200 hover:bg-ci-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
        >
          {showRaw ? "Table View" : "Raw View"}
        </button>
      </div>

      {!hasBytecode && (
        <p className="text-xs text-ci-dim">
          No bytecode available for this run.
        </p>
      )}

      {hasBytecode && showRaw ? (
        <pre className="text-xs font-mono text-ci-text overflow-auto max-h-64 whitespace-pre-wrap">
          {bytecodeRaw}
        </pre>
      ) : hasBytecode ? (
        <div className="overflow-auto max-h-64">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-ci-muted border-b border-ci-border">
                <th className="text-left py-1 px-2">Line</th>
                <th className="text-left py-1 px-2">Offset</th>
                <th className="text-left py-1 px-2">Opcode</th>
                <th className="text-left py-1 px-2">Arg</th>
                <th className="text-left py-1 px-2">Argval</th>
              </tr>
            </thead>
            <tbody>
              {opcodes.map((op) => (
                <tr
                  key={op.offset}
                  className="border-b border-ci-border/50 hover:bg-ci-surface transition-colors duration-150"
                >
                  <td className="py-1 px-2 text-ci-dim">
                    {op.line ?? ""}
                  </td>
                  <td className="py-1 px-2 text-ci-muted">{op.offset}</td>
                  <td className="py-1 px-2 text-ci-blue">{op.opname}</td>
                  <td className="py-1 px-2 text-ci-text">
                    {op.arg ?? ""}
                  </td>
                  <td className="py-1 px-2 text-ci-cyan">
                    {op.argval ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
