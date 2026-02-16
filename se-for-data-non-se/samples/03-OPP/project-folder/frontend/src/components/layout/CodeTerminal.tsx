import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CodeTerminalProps {
  code: string;
  title?: string;
}

export default function CodeTerminal({
  code,
  title = "Generated Python",
}: CodeTerminalProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: "var(--code-bg)",
        border: "1px solid rgba(232,114,42,0.12)",
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: "var(--font-code)",
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          background: "rgba(232,114,42,0.06)",
          border: "none",
          borderBottom: collapsed
            ? "none"
            : "1px solid rgba(232,114,42,0.08)",
          color: "var(--accent-spice)",
          fontFamily: "var(--font-heading)",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--success)", fontSize: "0.6rem" }}>●</span>
          {title}
        </span>
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: "0.7rem" }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <pre
              style={{
                padding: "1rem",
                margin: 0,
                fontSize: "0.8rem",
                lineHeight: 1.6,
                color: "var(--code-text)",
                overflowX: "auto",
                minHeight: 60,
              }}
            >
              {code || (
                <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
                  # Build a class to see the code...
                </span>
              )}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
