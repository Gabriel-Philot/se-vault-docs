import type { HeapBlock } from "../../lib/types";

interface HeapBlockComponentProps {
  block: HeapBlock;
}

export function HeapBlockComponent({ block }: HeapBlockComponentProps) {
  const isFreed = block.status === "freed";
  const widthPct = Math.min(100, Math.max(30, block.size * 2));

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-300 ${
        isFreed
          ? "border-ci-red/50 bg-ci-red/5 opacity-60"
          : "border-ci-blue bg-ci-blue/10"
      }`}
      style={{ width: `${widthPct}%` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-ci-muted">
          {block.address}
        </span>
        <span
          className={`text-[10px] font-mono ${isFreed ? "text-ci-red line-through" : "text-ci-green"}`}
        >
          {block.status}
        </span>
      </div>
      <div className="text-xs font-mono">
        <span className="text-ci-text">{block.type}</span>
        <span className="text-ci-dim ml-2">{block.size}B</span>
      </div>
      <div className="text-[10px] font-mono text-ci-dim mt-1">
        by {block.allocated_by}
      </div>
    </div>
  );
}
