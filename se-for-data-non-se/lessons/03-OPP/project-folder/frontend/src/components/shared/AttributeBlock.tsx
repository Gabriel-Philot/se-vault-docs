import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";

export interface AttributeData {
  id: string;
  name: string;
  type_hint: string;
  is_private: boolean;
  value?: string;
}

interface AttributeBlockProps {
  attribute: AttributeData;
  isDragOverlay?: boolean;
}

export default function AttributeBlock({
  attribute,
  isDragOverlay,
}: AttributeBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attribute.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const glowColor = attribute.is_private
    ? "rgba(192,57,43,0.5)"
    : "rgba(45,125,210,0.4)";
  const borderColor = attribute.is_private
    ? "var(--error)"
    : "var(--accent-fremen)";

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
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          fontSize: "0.78rem",
          fontFamily: "var(--font-code)",
          cursor: "grab",
          boxShadow: `0 0 8px ${glowColor}, inset 0 0 4px ${glowColor}`,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: "0.7rem" }}>
          {attribute.is_private ? "🔒" : "🔓"}
        </span>
        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
          {attribute.name}
        </span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>
          : {attribute.type_hint}
        </span>
      </div>
    </motion.div>
  );
}
