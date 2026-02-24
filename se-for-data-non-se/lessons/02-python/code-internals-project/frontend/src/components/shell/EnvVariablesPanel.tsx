import { Braces, Variable } from "lucide-react";

interface EnvVariablesPanelProps {
  env: Record<string, string>;
}

const KEY_VARS = ["HOME", "USER", "SHELL", "PWD", "PATH"];

export function EnvVariablesPanel({ env }: EnvVariablesPanelProps) {
  const entries = KEY_VARS.filter((k) => k in env).map((k) => [k, env[k]]);

  return (
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-medium text-ci-muted">
          <Variable size={14} className="text-ci-green" />
          Environment Variables
        </h3>
        <span className="rounded-full border border-ci-border bg-ci-bg/45 px-2 py-0.5 text-[11px] font-mono text-ci-dim">
          {entries.length} loaded
        </span>
      </div>
      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed border-ci-border bg-ci-panel/60 px-3 py-2 text-xs text-ci-dim">
          No shell environment loaded yet. Switch user or run a command to populate key vars.
        </div>
      )}
      <div className="rounded-lg border border-ci-border bg-ci-bg/55 p-2">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-ci-border bg-ci-panel/80 px-2 py-1 text-[11px] font-mono text-ci-dim">
          <Braces size={11} />
          export preview
        </div>
        <div className="space-y-1 font-mono text-xs">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="rounded-md border border-transparent px-2 py-1 transition-colors duration-150 hover:border-ci-border hover:bg-ci-panel/50"
            >
              <span className="text-ci-green">{key}</span>
              <span className="text-ci-dim">=</span>
              <span className="break-all text-ci-text">{val}</span>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="px-2 py-1 font-mono text-xs text-ci-dim">$USER, $PATH, $HOME ...</div>
          )}
        </div>
      </div>
    </div>
  );
}
