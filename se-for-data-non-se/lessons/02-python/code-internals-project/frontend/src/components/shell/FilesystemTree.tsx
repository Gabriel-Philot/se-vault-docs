import { ChevronRight, File, Folder } from "lucide-react";
import { useState } from "react";
import type { FilesystemNode } from "../../lib/types";

interface FilesystemTreeProps {
  tree: FilesystemNode;
  currentUser: string;
}

function TreeNode({
  node,
  currentUser,
  depth,
}: {
  node: FilesystemNode;
  currentUser: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.type === "directory";
  const isOwner = node.owner === currentUser;

  return (
    <div>
      <button
        onClick={() => isDir && setExpanded(!expanded)}
        aria-expanded={isDir ? expanded : undefined}
        className={
          isOwner
            ? "flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-left text-xs font-mono text-ci-green transition-colors duration-150 hover:bg-ci-surface"
            : "flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-left text-xs font-mono text-ci-text transition-colors duration-150 hover:bg-ci-surface"
        }
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir && (
          <ChevronRight
            size={12}
            className={
              expanded
                ? "rotate-90 transition-transform duration-150"
                : "transition-transform duration-150"
            }
          />
        )}
        {isDir ? (
          <Folder size={14} className="text-ci-amber" />
        ) : (
          <File size={14} className="text-ci-muted" />
        )}
        <span>{node.name}</span>
        <span className="text-ci-dim ml-auto">{node.permissions}</span>
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.name}
          node={child}
          currentUser={currentUser}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function FilesystemTree({ tree, currentUser }: FilesystemTreeProps) {
  return (
    <div className="bg-ci-panel rounded-lg border border-ci-border p-3">
      <h3 className="text-sm font-medium text-ci-muted mb-2">Filesystem</h3>
      <TreeNode node={tree} currentUser={currentUser} depth={0} />
    </div>
  );
}
