import type { HeapBlock } from "../../lib/types";
import { HeapBlockComponent } from "./HeapBlockComponent";

interface HeapColumnProps {
  blocks: HeapBlock[];
}

export function HeapColumn({ blocks }: HeapColumnProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ci-purple border-b border-ci-purple/30 pb-1">
        HEAP
      </h3>
      {blocks.length === 0 ? (
        <p className="text-xs text-ci-dim">No heap allocations</p>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <HeapBlockComponent key={block.address} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
