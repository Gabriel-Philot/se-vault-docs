interface RefCountBadgeProps {
  address: string;
  count: number;
}

export function RefCountBadge({ address, count }: RefCountBadgeProps) {
  const severityClass =
    count <= 1
      ? "border-ci-green/35 bg-ci-green/12 text-ci-green"
      : count <= 3
        ? "border-ci-blue/35 bg-ci-blue/12 text-ci-blue"
        : "border-ci-purple/35 bg-ci-purple/15 text-ci-purple";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono ${severityClass}`}
      title={`Refcount for ${address}: ${count}`}
    >
      <span className="text-ci-dim">{address}</span>
      <span>rc:{count}</span>
    </span>
  );
}
