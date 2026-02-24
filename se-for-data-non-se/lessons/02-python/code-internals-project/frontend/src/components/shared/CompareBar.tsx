interface CompareBarProps {
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
  unit?: string;
}

export function CompareBar({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftColor = "bg-ci-amber",
  rightColor = "bg-ci-purple",
  unit = "bytes",
}: CompareBarProps) {
  const max = Math.max(leftValue, rightValue, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-ci-muted w-20 text-right">
          {leftLabel}
        </span>
        <div className="flex-1 h-6 bg-ci-surface rounded overflow-hidden">
          <div
            className={`h-full ${leftColor} rounded transition-all duration-500`}
            style={{ width: `${(leftValue / max) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-ci-text w-24">
          {leftValue} {unit}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-ci-muted w-20 text-right">
          {rightLabel}
        </span>
        <div className="flex-1 h-6 bg-ci-surface rounded overflow-hidden">
          <div
            className={`h-full ${rightColor} rounded transition-all duration-500`}
            style={{ width: `${(rightValue / max) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-ci-text w-24">
          {rightValue} {unit}
        </span>
      </div>
    </div>
  );
}
