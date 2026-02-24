import { ChevronRight, File, Folder, Lock } from "lucide-react";
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
  const isDir = node.type === "directory" || node.type === "dir";
  const isOwner = node.owner === currentUser;
  const isPrivate = node.permissions.startsWith("---") || node.permissions.includes("------");

  return (
    <div>
      <button
        onClick={() => isDir && setExpanded(!expanded)}
        aria-expanded={isDir ? expanded : undefined}
        className={
          isOwner
            ? "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-mono text-ci-green transition-colors duration-150 hover:bg-ci-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/50 focus-visible:ring-inset"
            : "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-mono text-ci-text transition-colors duration-150 hover:bg-ci-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-muted/45 focus-visible:ring-inset"
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
          <File size={14} className={isOwner ? "text-ci-green/80" : "text-ci-muted"} />
        )}
        <span>{node.name}</span>
        {isPrivate && !isDir && <Lock size={11} className="text-ci-red/80" />}
        <span className="ml-auto rounded border border-ci-border bg-ci-bg/55 px-1.5 py-0.5 text-[10px] text-ci-dim">
          {node.permissions}
        </span>
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
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/40 p-3 shadow-lg shadow-black/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ci-muted">Filesystem</h3>
        <span className="rounded-full border border-ci-border bg-ci-bg/50 px-2 py-0.5 text-[11px] font-mono text-ci-dim">
          owner: {currentUser}
        </span>
      </div>
      <TreeNode node={tree} currentUser={currentUser} depth={0} />
    </div>
  );
}
