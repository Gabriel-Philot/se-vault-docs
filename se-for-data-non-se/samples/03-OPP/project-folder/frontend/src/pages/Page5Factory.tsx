import { useState } from "react";
import PipelineBuilder from "@/components/page5/PipelineBuilder";
import ResetButton from "@/components/shared/ResetButton";

export default function Page5Factory() {
  const [code, setCode] = useState("");
  const [rawCode, setRawCode] = useState("");
  const [factoryCode, setFactoryCode] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [factoryCollapsed, setFactoryCollapsed] = useState(false);
  const [compareCollapsed, setCompareCollapsed] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/pipeline/reset", { method: "POST" });
      setCode("");
      setRawCode("");
      setFactoryCode("");
      setResetKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  const handleCodeChange = (newCode: string, newRawCode?: string, newFactoryCode?: string) => {
    setCode(newCode);
    if (newRawCode !== undefined) setRawCode(newRawCode);
    if (newFactoryCode !== undefined) setFactoryCode(newFactoryCode);
  };

  const hasCode = !!(code || rawCode || factoryCode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ResetButton onReset={handleReset} loading={resetting} />
      </div>
      <PipelineBuilder onCodeChange={handleCodeChange} resetKey={resetKey} />

      {/* Block 1: Collapsible Factory Definitions */}
      {hasCode && factoryCode && (
        <div
          style={{
            background: "var(--code-bg)",
            border: "1px solid rgba(45,125,210,0.15)",
            borderRadius: 8,
            overflow: "hidden",
            fontFamily: "var(--font-code)",
          }}
        >
          <button
            onClick={() => setFactoryCollapsed(!factoryCollapsed)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1rem",
              background: "rgba(45,125,210,0.06)",
              border: "none",
              borderBottom: factoryCollapsed
                ? "none"
                : "1px solid rgba(45,125,210,0.1)",
              color: "var(--accent-fremen)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--accent-fremen)", fontSize: "0.6rem" }}>
                {"\u25CF"}
              </span>
              Factory Pattern — Definicoes
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                transform: factoryCollapsed ? "rotate(-90deg)" : "rotate(0)",
                transition: "transform 0.2s",
              }}
            >
              {"\u25BC"}
            </span>
          </button>

          {!factoryCollapsed && (
            <pre
              style={{
                padding: "1rem",
                margin: 0,
                fontSize: "0.75rem",
                lineHeight: 1.6,
                color: "var(--code-text)",
                overflowX: "auto",
              }}
            >
              {factoryCode}
            </pre>
          )}
        </div>
      )}

      {/* Block 2: Side-by-side comparison */}
      {hasCode && (code || rawCode) && (
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
            onClick={() => setCompareCollapsed(!compareCollapsed)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1rem",
              background: "rgba(232,114,42,0.06)",
              border: "none",
              borderBottom: compareCollapsed
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
              <span style={{ color: "var(--success)", fontSize: "0.6rem" }}>
                {"\u25CF"}
              </span>
              Comparacao de Uso
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                transform: compareCollapsed ? "rotate(-90deg)" : "rotate(0)",
                transition: "transform 0.2s",
              }}
            >
              {"\u25BC"}
            </span>
          </button>

          {!compareCollapsed && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              {/* LEFT: SEM FACTORY */}
              <div
                style={{
                  borderRight: "1px solid rgba(232,114,42,0.08)",
                }}
              >
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(192,57,43,0.06)",
                    borderBottom: "2px solid rgba(192,57,43,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--error)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    SEM FACTORY
                  </span>
                </div>
                <pre
                  style={{
                    padding: "1rem",
                    margin: 0,
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: "var(--code-text)",
                    overflowX: "auto",
                    minHeight: 120,
                  }}
                >
                  {rawCode || (
                    <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
                      # Build a pipeline to see the comparison...
                    </span>
                  )}
                </pre>
              </div>

              {/* RIGHT: COM FACTORY + POLIMORFISMO */}
              <div>
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    background: "rgba(232,114,42,0.06)",
                    borderBottom: "2px solid rgba(232,114,42,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--accent-spice)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    COM FACTORY + POLIMORFISMO
                  </span>
                </div>
                <pre
                  style={{
                    padding: "1rem",
                    margin: 0,
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: "var(--code-text)",
                    overflowX: "auto",
                    minHeight: 120,
                  }}
                >
                  {code || (
                    <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
                      # Build a pipeline to see the comparison...
                    </span>
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
