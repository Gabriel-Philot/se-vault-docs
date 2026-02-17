import { motion } from "motion/react";

interface ObjectAttribute {
  name: string;
  type_hint: string;
  is_private: boolean;
  value?: string;
}

interface ObjectBadgeProps {
  instanceName: string;
  className: string;
  attributes: ObjectAttribute[];
}

export default function ObjectBadge({
  instanceName,
  className,
  attributes,
}: ObjectBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--success)",
        borderRadius: 10,
        padding: "0.75rem 1rem",
        boxShadow:
          "0 0 16px rgba(240,160,48,0.2), 0 0 32px rgba(240,160,48,0.08)",
        minWidth: 160,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.4rem",
          marginBottom: "0.5rem",
          borderBottom: "1px solid rgba(240,160,48,0.15)",
          paddingBottom: "0.4rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-code)",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--success)",
          }}
        >
          {instanceName}
        </span>
        <span
          style={{
            fontFamily: "var(--font-code)",
            fontSize: "0.65rem",
            color: "var(--text-secondary)",
          }}
        >
          : {className}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {attributes.map((attr) => (
          <div
            key={attr.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.7rem",
              fontFamily: "var(--font-code)",
            }}
          >
            <span style={{ fontSize: "0.6rem" }}>
              {attr.is_private ? "🔒" : "🔓"}
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {attr.name}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>=</span>
            <span style={{ color: "var(--code-text)" }}>
              {attr.value ?? "None"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
