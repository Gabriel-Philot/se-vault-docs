import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ClassNode from "./ClassNode";

interface TreeNodeData {
  name: string;
  parent: string | null;
  children: string[];
  attributes: { name: string; type_hint: string; is_private: boolean }[];
  methods: {
    name: string;
    params: string[];
    body: string;
    is_inherited: boolean;
    is_overridden: boolean;
  }[];
}

interface FamilyTreeProps {
  onSelectClass: (name: string) => void;
  refreshKey: number;
}

const nodeTypes = { classNode: ClassNode };

function layoutTree(treeNodes: TreeNodeData[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodeMap = new Map(treeNodes.map((n) => [n.name, n]));
  const roots = treeNodes.filter((n) => !n.parent || !nodeMap.has(n.parent));

  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const X_GAP = 220;
  const Y_GAP = 180;

  let xOffset = 0;

  function traverse(
    name: string,
    depth: number,
    onSelect: (n: string) => void
  ) {
    const node = nodeMap.get(name);
    if (!node) return;

    const x = xOffset * X_GAP;
    const y = depth * Y_GAP;

    flowNodes.push({
      id: name,
      type: "classNode",
      position: { x, y },
      data: {
        label: name,
        parent: node.parent,
        attributes: node.attributes,
        methods: node.methods,
        onSelect,
      },
    });

    if (node.parent && nodeMap.has(node.parent)) {
      flowEdges.push({
        id: `${node.parent}->${name}`,
        source: node.parent,
        target: name,
        style: { stroke: "var(--accent-fremen)", strokeWidth: 2 },
        animated: true,
      });
    }

    if (node.children.length === 0) {
      xOffset++;
    } else {
      for (const child of node.children) {
        traverse(child, depth + 1, onSelect);
      }
    }
  }

  // Placeholder onSelect — will be rebound in fetchTree
  const noop = () => {};
  for (const root of roots) {
    traverse(root.name, 0, noop);
  }

  return { nodes: flowNodes, edges: flowEdges };
}

export default function FamilyTree({
  onSelectClass,
  refreshKey,
}: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inheritance/tree");
      if (!res.ok) return;
      const data = await res.json();
      const { nodes: n, edges: e } = layoutTree(data.nodes);

      // Rebind onSelect since it can't be serialized from layout
      const bound = n.map((node) => ({
        ...node,
        data: { ...node.data, onSelect: onSelectClass },
      }));

      setNodes(bound);
      setEdges(e);
    } finally {
      setLoading(false);
    }
  }, [onSelectClass, setNodes, setEdges]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree, refreshKey]);

  if (loading && nodes.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
        }}
      >
        Loading tree...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
          border: "1px dashed rgba(232,114,42,0.15)",
          borderRadius: 12,
        }}
      >
        No classes yet. Create a class on Page 1 first, then build children
        here.
      </div>
    );
  }

  return (
    <div
      style={{
        height: 400,
        background: "var(--bg-primary)",
        borderRadius: 12,
        border: "1px solid rgba(232,114,42,0.12)",
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-primary)" }}
      >
        <Background color="rgba(232,114,42,0.06)" gap={20} />
      </ReactFlow>
    </div>
  );
}
