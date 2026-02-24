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
    <div className="rounded-xl border border-ci-border bg-ci-panel p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-ci-muted">Python Bytecode</h3>
          <p className="mt-1 text-[11px] text-ci-dim">Switch between disassembled table and raw interpreter dump.</p>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          aria-pressed={showRaw}
          className="rounded-md border border-ci-blue/40 bg-ci-blue/10 px-2.5 py-1 text-xs font-medium text-ci-blue transition-all duration-200 hover:bg-ci-blue/20 hover:shadow-[0_0_16px_rgba(56,189,248,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
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
        <pre className="max-h-72 overflow-auto rounded-md border border-ci-border/60 bg-ci-surface/45 p-3 text-xs font-mono text-ci-text whitespace-pre-wrap">
          {bytecodeRaw}
        </pre>
      ) : hasBytecode ? (
        <div className="max-h-72 overflow-auto rounded-md border border-ci-border/70">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-ci-border bg-ci-surface/60 text-ci-muted">
                <th className="px-2 py-1 text-left">Line</th>
                <th className="px-2 py-1 text-left">Offset</th>
                <th className="px-2 py-1 text-left">Opcode</th>
                <th className="px-2 py-1 text-left">Arg</th>
                <th className="px-2 py-1 text-left">Argval</th>
              </tr>
            </thead>
            <tbody>
              {opcodes.map((op) => (
                <tr
                  key={op.offset}
                  className="border-b border-ci-border/50 transition-colors duration-150 hover:bg-ci-surface"
                >
                  <td className="px-2 py-1 text-ci-dim">
                    {op.line ?? ""}
                  </td>
                  <td className="px-2 py-1 text-ci-muted">{op.offset}</td>
                  <td className="px-2 py-1 text-ci-blue">{op.opname}</td>
                  <td className="px-2 py-1 text-ci-text">
                    {op.arg ?? ""}
                  </td>
                  <td className="px-2 py-1 text-ci-cyan">
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
