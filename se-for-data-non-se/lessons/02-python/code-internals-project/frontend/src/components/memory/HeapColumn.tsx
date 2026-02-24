import type { HeapBlock } from "../../lib/types";
import { HeapBlockComponent } from "./HeapBlockComponent";

interface HeapColumnProps {
  blocks: HeapBlock[];
}

export function HeapColumn({ blocks }: HeapColumnProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-ci-cyan/25 pb-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-ci-cyan">
          Heap Memory
        </h3>
        <span className="rounded-full border border-ci-cyan/35 bg-ci-cyan/10 px-2 py-0.5 text-[10px] font-mono text-ci-cyan">
          {blocks.length} block{blocks.length === 1 ? "" : "s"}
        </span>
      </div>
      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ci-border px-3 py-4 text-xs text-ci-dim">
          No heap allocations
        </p>
      ) : (
        <div className="flex flex-wrap items-start gap-2 rounded-lg border border-ci-border/70 bg-ci-bg/25 p-2">
          {blocks.map((block) => (
            <HeapBlockComponent key={block.address} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
