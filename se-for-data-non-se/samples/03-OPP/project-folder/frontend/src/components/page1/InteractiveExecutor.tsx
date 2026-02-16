import { useState } from "react";

interface InteractiveExecutorProps {
  classCode: string;
}

export default function InteractiveExecutor({
  classCode,
}: InteractiveExecutorProps) {
  const [userCode, setUserCode] = useState("# Instancie sua classe e teste:\n");
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);

  if (!classCode) return null;

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch("/api/class/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userCode }),
      });
      if (!res.ok) {
        setOutput("Request failed");
        setIsError(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOutput(data.stdout || "(no output)");
        setIsError(false);
      } else {
        setOutput(data.error || "Unknown error");
        setIsError(true);
      }
    } catch {
      setOutput("Connection error");
      setIsError(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--code-bg)",
        border: "1px solid rgba(232,114,42,0.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "0.5rem 1rem",
          background: "rgba(232,114,42,0.06)",
          borderBottom: "1px solid rgba(232,114,42,0.08)",
          fontFamily: "var(--font-heading)",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--accent-spice)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ color: "var(--accent-fremen)", fontSize: "0.6rem" }}>
          {"\u25B6"}
        </span>
        Interactive Executor
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 180,
        }}
      >
        {/* Left: class code (read-only) */}
        <div
          style={{
            borderRight: "1px solid rgba(232,114,42,0.08)",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.4rem",
              fontFamily: "var(--font-heading)",
            }}
          >
            Class Definition
          </span>
          <pre
            style={{
              flex: 1,
              margin: 0,
              fontSize: "0.75rem",
              lineHeight: 1.5,
              color: "var(--code-text)",
              fontFamily: "var(--font-code)",
              overflow: "auto",
            }}
          >
            {classCode}
          </pre>
        </div>

        {/* Right: user code + run + output */}
        <div
          style={{
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-heading)",
            }}
          >
            Your Code
          </span>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              minHeight: 80,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(45,125,210,0.2)",
              borderRadius: 4,
              padding: "0.5rem",
              color: "var(--code-text)",
              fontFamily: "var(--font-code)",
              fontSize: "0.75rem",
              lineHeight: 1.5,
              resize: "vertical",
              outline: "none",
            }}
          />
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              alignSelf: "flex-start",
              padding: "0.35rem 0.8rem",
              background: running
                ? "rgba(45,125,210,0.2)"
                : "var(--accent-fremen)",
              border: "1px solid var(--accent-fremen)",
              borderRadius: 5,
              color: "var(--bg-primary)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: running ? "default" : "pointer",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {running ? "Running..." : "Run"}
          </button>
          {output && (
            <pre
              style={{
                margin: 0,
                padding: "0.5rem",
                background: "rgba(0,0,0,0.15)",
                borderRadius: 4,
                fontSize: "0.72rem",
                lineHeight: 1.5,
                fontFamily: "var(--font-code)",
                color: isError ? "var(--error)" : "var(--success)",
                overflow: "auto",
                maxHeight: 120,
                whiteSpace: "pre-wrap",
              }}
            >
              {output}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
