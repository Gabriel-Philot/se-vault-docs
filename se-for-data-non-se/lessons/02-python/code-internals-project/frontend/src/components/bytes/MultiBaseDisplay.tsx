interface MultiBaseDisplayProps {
  bytes: number[];
  binary: string[];
  hex: string[];
}

export function MultiBaseDisplay({
  bytes,
  binary,
  hex,
}: MultiBaseDisplayProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ci-muted">
        Multi-Base Representation
      </h3>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {bytes.map((b, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 p-2 bg-ci-surface rounded border border-ci-border"
            >
              <span className="text-xs font-mono text-ci-text">{b}</span>
              <span className="text-xs font-mono text-ci-cyan">{hex[i]}</span>
              <span className="text-xs font-mono text-ci-green">
                {binary[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 text-xs text-ci-dim">
        <span>
          <span className="text-ci-text">Dec</span>
        </span>
        <span>
          <span className="text-ci-cyan">Hex</span>
        </span>
        <span>
          <span className="text-ci-green">Bin</span>
        </span>
      </div>
    </div>
  );
}
