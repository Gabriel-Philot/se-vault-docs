import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";

export interface MethodData {
  id: string;
  name: string;
  params: string[];
  body: string;
}

interface MethodBlockProps {
  method: MethodData;
  isDragOverlay?: boolean;
}

export default function MethodBlock({
  method,
  isDragOverlay,
}: MethodBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: method.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--accent-spice)",
          borderRadius: 6,
          fontSize: "0.78rem",
          fontFamily: "var(--font-code)",
          cursor: "grab",
          boxShadow:
            "0 0 8px rgba(232,114,42,0.3), inset 0 0 4px rgba(232,114,42,0.15)",
          userSelect: "none",
        }}
      >
        <span style={{ color: "var(--accent-spice)", fontSize: "0.7rem" }}>
          ƒ
        </span>
        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
          {method.name}
        </span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>
          ({method.params.join(", ")})
        </span>
      </div>
    </motion.div>
  );
}
