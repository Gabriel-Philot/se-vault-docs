import type { HeapBlock } from "../../lib/types";

interface HeapBlockComponentProps {
  block: HeapBlock;
}

export function HeapBlockComponent({ block }: HeapBlockComponentProps) {
  const isFreed = block.status === "freed";
  const widthPct = Math.min(100, Math.max(36, block.size * 1.8));

  return (
    <div
      className={`min-w-[180px] flex-1 rounded-xl border p-3 transition-all duration-300 ${
        isFreed
          ? "border-ci-red/50 bg-ci-red/5 opacity-70"
          : "border-ci-cyan/35 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-ci-cyan)_8%,transparent)_0%,color-mix(in_srgb,var(--color-ci-panel)_96%,transparent)_100%)]"
      }`}
      style={{ width: `${widthPct}%` }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-mono text-ci-muted">
          {block.address}
        </span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-mono ${
            isFreed
              ? "border-ci-red/40 text-ci-red"
              : "border-ci-green/35 bg-ci-green/10 text-ci-green"
          }`}
        >
          {block.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-ci-text">{block.type}</span>
        <span className="text-ci-dim">{block.size}B</span>
      </div>
      <div className="text-[10px] font-mono text-ci-dim mt-1">
        by {block.allocated_by}
      </div>
    </div>
  );
}
