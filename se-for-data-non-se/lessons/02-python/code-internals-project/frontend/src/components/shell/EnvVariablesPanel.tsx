interface EnvVariablesPanelProps {
  env: Record<string, string>;
}

const KEY_VARS = ["HOME", "USER", "SHELL", "PWD", "PATH"];

export function EnvVariablesPanel({ env }: EnvVariablesPanelProps) {
  const entries = KEY_VARS.filter((k) => k in env).map((k) => [k, env[k]]);

  return (
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/15">
      <h3 className="text-sm font-medium text-ci-muted mb-3">
        Environment Variables
      </h3>
      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed border-ci-border bg-ci-panel/60 px-3 py-2 text-xs text-ci-dim">
          No shell environment loaded yet. Switch user or run a command to populate key vars.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="rounded-lg border border-ci-border bg-ci-surface px-2.5 py-2 transition-colors duration-150 hover:border-ci-muted/55"
          >
            <div className="text-xs font-mono text-ci-green">${key}</div>
            <div className="text-xs font-mono text-ci-text break-all">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
