import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "motion/react";
import AttributeBlock, { type AttributeData } from "./AttributeBlock";
import MethodBlock, { type MethodData } from "./MethodBlock";

interface ClassCardProps {
  className: string;
  attributes: AttributeData[];
  methods: MethodData[];
}

export default function ClassCard({
  className,
  attributes,
  methods,
}: ClassCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "class-card-drop" });

  const allIds = [
    ...attributes.map((a) => a.id),
    ...methods.map((m) => m.id),
  ];

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        boxShadow: isOver
          ? "0 0 24px rgba(232,114,42,0.4), 0 0 48px rgba(232,114,42,0.15)"
          : "0 0 12px rgba(232,114,42,0.1)",
      }}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid rgba(232,114,42,0.2)",
        borderRadius: 12,
        padding: "1.25rem",
        minHeight: 200,
        minWidth: 300,
        position: "relative",
      }}
    >
      {/* Class header */}
      <div
        style={{
          textAlign: "center",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid rgba(232,114,42,0.15)",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          class
        </span>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
            margin: 0,
          }}
        >
          {className || "MyClass"}
        </h3>
      </div>

      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        {/* Attributes section */}
        <div style={{ marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            Attributes
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {attributes.length === 0 && (
              <div
                style={{
                  padding: "0.75rem",
                  border: "1px dashed rgba(232,114,42,0.2)",
                  borderRadius: 6,
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.7rem",
                }}
              >
                Drag attributes here
              </div>
            )}
            {attributes.map((attr) => (
              <AttributeBlock key={attr.id} attribute={attr} />
            ))}
          </div>
        </div>

        {/* Methods section */}
        <div>
          <span
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            Methods
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {methods.length === 0 && (
              <div
                style={{
                  padding: "0.75rem",
                  border: "1px dashed rgba(232,114,42,0.2)",
                  borderRadius: 6,
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "0.7rem",
                }}
              >
                Drag methods here
              </div>
            )}
            {methods.map((method) => (
              <MethodBlock key={method.id} method={method} />
            ))}
          </div>
        </div>
      </SortableContext>

      {/* Drop highlight overlay */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            border: "2px dashed var(--accent-spice)",
            background: "rgba(232,114,42,0.04)",
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
}
