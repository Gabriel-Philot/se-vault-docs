interface RefCountBadgeProps {
  address: string;
  count: number;
}

export function RefCountBadge({ address, count }: RefCountBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-ci-purple/20 text-ci-purple border border-ci-purple/30"
      title={`Refcount for ${address}: ${count}`}
    >
      rc:{count}
    </span>
  );
}
