import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "motion/react";

interface ClassNodeData {
  label: string;
  parent: string | null;
  attributes: { name: string; type_hint: string; is_private: boolean }[];
  methods: {
    name: string;
    params: string[];
    is_inherited: boolean;
    is_overridden: boolean;
  }[];
  onSelect: (name: string) => void;
  [key: string]: unknown;
}

export default function ClassNode({ data }: NodeProps) {
  const d = data as unknown as ClassNodeData;

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => d.onSelect(d.label)}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid rgba(232,114,42,0.25)",
        borderRadius: 10,
        padding: "0.6rem 0.8rem",
        minWidth: 180,
        cursor: "pointer",
        boxShadow: "0 0 12px rgba(232,114,42,0.08)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "var(--accent-fremen)", width: 8, height: 8 }}
      />

      {/* Class name header */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "1px solid rgba(232,114,42,0.12)",
          paddingBottom: "0.35rem",
          marginBottom: "0.35rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
          }}
        >
          {d.label}
        </span>
        {d.parent && (
          <span
            style={{
              display: "block",
              fontSize: "0.6rem",
              color: "var(--accent-fremen)",
              fontFamily: "var(--font-code)",
            }}
          >
            extends {d.parent}
          </span>
        )}
      </div>

      {/* Attributes */}
      {d.attributes.length > 0 && (
        <div style={{ marginBottom: "0.3rem" }}>
          {d.attributes.map((attr) => (
            <div
              key={attr.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.65rem",
                fontFamily: "var(--font-code)",
                padding: "0.1rem 0",
              }}
            >
              <span style={{ fontSize: "0.55rem" }}>
                {attr.is_private ? "🔒" : "🔓"}
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {attr.name}: {attr.type_hint}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Methods */}
      {d.methods.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(232,114,42,0.08)",
            paddingTop: "0.3rem",
          }}
        >
          {d.methods.map((m) => (
            <div
              key={m.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.65rem",
                fontFamily: "var(--font-code)",
                padding: "0.1rem 0",
              }}
            >
              <span style={{ color: "var(--accent-spice)", fontSize: "0.6rem" }}>
                ƒ
              </span>
              <span style={{ color: "var(--text-primary)" }}>{m.name}()</span>
              {m.is_inherited && (
                <span
                  style={{
                    fontSize: "0.5rem",
                    background: "rgba(45,125,210,0.15)",
                    color: "var(--accent-fremen)",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 3,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                  }}
                >
                  Herdado
                </span>
              )}
              {m.is_overridden && (
                <span
                  style={{
                    fontSize: "0.5rem",
                    background: "rgba(232,114,42,0.15)",
                    color: "var(--accent-spice)",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 3,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                  }}
                >
                  Override
                </span>
              )}
              {!m.is_inherited && !m.is_overridden && (
                <span
                  style={{
                    fontSize: "0.5rem",
                    background: "rgba(232,114,42,0.15)",
                    color: "var(--accent-spice)",
                    padding: "0.1rem 0.3rem",
                    borderRadius: 3,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                  }}
                >
                  Proprio
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "var(--accent-spice)", width: 8, height: 8 }}
      />
    </motion.div>
  );
}
