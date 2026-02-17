import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SourceInfo {
  class_name: string;
  description: string;
  read_method_body: string;
}

interface SourceState {
  status: "idle" | "running" | "done" | "error";
  message: string;
  result: string | null;
}

interface ArenaProps {
  onCodeChange: (code: string) => void;
  resetKey?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  CsvSource: "var(--accent-spice)",
  ParquetSource: "var(--accent-fremen)",
  ApiSource: "var(--success)",
};

export default function Arena({ onCodeChange, resetKey }: ArenaProps) {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [states, setStates] = useState<Record<string, SourceState>>({});
  const [executing, setExecuting] = useState(false);
  const [hierarchy, setHierarchy] = useState<{
    base_class_name: string;
    base_class_code: string;
    children: { class_name: string; class_code: string }[];
  } | null>(null);
  const [hierarchyOpen, setHierarchyOpen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/polymorphism/sources");
        if (!res.ok) return;
        const data = await res.json();
        setSources(data.sources);
        setSelected(new Set(data.sources.map((s: SourceInfo) => s.class_name)));
        setStates({});
        if (data.hierarchy) setHierarchy(data.hierarchy);
      } catch {
        // ignore
      }
    })();
  }, [resetKey]);

  const toggleSource = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const execute = useCallback(async () => {
    if (selected.size === 0) return;
    setExecuting(true);

    // Reset states
    const initial: Record<string, SourceState> = {};
    selected.forEach((name) => {
      initial[name] = { status: "idle", message: "", result: null };
    });
    setStates(initial);

    // Build code preview
    const codeLines = [
      "# Polymorphism: same interface, different implementations",
      `sources = [${[...selected].map((s) => `${s}()`).join(", ")}]`,
      "",
      "for source in sources:",
      "    data = source.read()  # same method, different behavior",
      "    print(f\"{source.__class__.__name__}: {data}\")",
    ];
    onCodeChange(codeLines.join("\n"));

    try {
      const res = await fetch("/api/polymorphism/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_class_names: [...selected],
        }),
      });

      if (!res.ok || !res.body) {
        setExecuting(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const raw = line.slice(5).trim();
            if (!raw) continue;
            try {
              const event = JSON.parse(raw);
              const name = event.source_class;
              const type = event.event_type;

              setStates((prev) => ({
                ...prev,
                [name]: {
                  status:
                    type === "result"
                      ? "done"
                      : type === "error"
                        ? "error"
                        : "running",
                  message: event.message,
                  result: event.data ?? null,
                },
              }));
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setExecuting(false);
    }
  }, [selected, onCodeChange]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
            margin: 0,
          }}
        >
          Polymorphism Arena
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            marginTop: "0.3rem",
          }}
        >
          Same .read() interface, different implementations. Select sources and
          execute to see polymorphism in action.
        </p>
      </div>

      {/* Class Hierarchy */}
      {hierarchy && (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid rgba(45,125,210,0.15)",
            borderRadius: 10,
            marginBottom: "1.5rem",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setHierarchyOpen(!hierarchyOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1rem",
              background: "rgba(45,125,210,0.06)",
              border: "none",
              borderBottom: hierarchyOpen
                ? "1px solid rgba(45,125,210,0.1)"
                : "none",
              color: "var(--accent-fremen)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <span>Class Hierarchy</span>
            <span
              style={{
                fontSize: "0.7rem",
                transform: hierarchyOpen ? "rotate(0)" : "rotate(-90deg)",
                transition: "transform 0.2s",
              }}
            >
              {"\u25BC"}
            </span>
          </button>

          {hierarchyOpen && (
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Base class box */}
              <div
                style={{
                  background: "var(--code-bg)",
                  border: "2px solid var(--accent-fremen)",
                  borderRadius: 8,
                  padding: "0.75rem 1.25rem",
                  textAlign: "center",
                  boxShadow: "0 0 16px rgba(45,125,210,0.2)",
                  maxWidth: 320,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "var(--accent-fremen)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {hierarchy.base_class_name} (ABC)
                </div>
                <pre
                  style={{
                    fontSize: "0.6rem",
                    fontFamily: "var(--font-code)",
                    color: "var(--code-text)",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                  }}
                >
                  @abstractmethod{"\n"}def read(self) -{">"} Any: ...
                </pre>
              </div>

              {/* Vertical connector */}
              <div style={{ width: 2, height: 24, background: "rgba(45,125,210,0.3)" }} />

              {/* Horizontal connector */}
              <div
                style={{
                  width: `${Math.max(60, hierarchy.children.length * 33)}%`,
                  height: 2,
                  background: "rgba(45,125,210,0.3)",
                  position: "relative",
                }}
              />

              {/* Child class boxes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${hierarchy.children.length}, 1fr)`,
                  gap: "1rem",
                  width: "100%",
                  marginTop: 0,
                }}
              >
                {hierarchy.children.map((child) => {
                  const color =
                    SOURCE_COLORS[child.class_name] ?? "var(--accent-spice)";
                  return (
                    <div
                      key={child.class_name}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                      {/* Vertical connector from horizontal line */}
                      <div
                        style={{
                          width: 2,
                          height: 20,
                          background: "rgba(45,125,210,0.3)",
                        }}
                      />
                      <div
                        style={{
                          background: "var(--code-bg)",
                          border: `1px solid ${color}`,
                          borderRadius: 8,
                          padding: "0.6rem 0.75rem",
                          width: "100%",
                          boxShadow: `0 0 10px ${color}22`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color,
                            marginBottom: "0.25rem",
                          }}
                        >
                          {child.class_name}
                        </div>
                        <pre
                          style={{
                            fontSize: "0.55rem",
                            fontFamily: "var(--font-code)",
                            color: "var(--code-text)",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.4,
                          }}
                        >
                          {child.class_code
                            .split("\n")
                            .filter((l) => l.includes("def read"))
                            .map((l) => l.trim())
                            .join("\n") || "def read(self): ..."}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${sources.length || 1}, 1fr)`,
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {sources.map((source) => {
          const isSelected = selected.has(source.class_name);
          const state = states[source.class_name];
          const color =
            SOURCE_COLORS[source.class_name] ?? "var(--accent-spice)";

          return (
            <motion.div
              key={source.class_name}
              whileHover={{ scale: 1.02 }}
              onClick={() => !executing && toggleSource(source.class_name)}
              style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${isSelected ? color : "rgba(232,114,42,0.1)"}`,
                borderRadius: 10,
                padding: "1rem",
                cursor: executing ? "default" : "pointer",
                opacity: isSelected ? 1 : 0.5,
                transition: "opacity 0.2s, border-color 0.2s",
                boxShadow: isSelected
                  ? `0 0 12px ${color}33`
                  : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <h4
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color,
                    margin: 0,
                  }}
                >
                  {source.class_name}
                </h4>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `2px solid ${color}`,
                    background: isSelected ? color : "transparent",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                {source.description}
              </p>

              <pre
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-code)",
                  color: "var(--code-text)",
                  background: "var(--code-bg)",
                  padding: "0.4rem",
                  borderRadius: 4,
                  overflow: "auto",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                def read(self):{"\n"}
                {"    "}
                {source.read_method_body}
              </pre>

              {/* Execution status */}
              <AnimatePresence>
                {state && state.status !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{ marginTop: "0.6rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginBottom: "0.3rem",
                      }}
                    >
                      {state.status === "running" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: `2px solid ${color}`,
                            borderTopColor: "transparent",
                          }}
                        />
                      )}
                      {state.status === "done" && (
                        <span style={{ color: "var(--success)", fontSize: "0.7rem" }}>
                          ●
                        </span>
                      )}
                      {state.status === "error" && (
                        <span style={{ color: "var(--error)", fontSize: "0.7rem" }}>
                          ●
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {state.message}
                      </span>
                    </div>

                    {state.result && (
                      <pre
                        style={{
                          fontSize: "0.6rem",
                          fontFamily: "var(--font-code)",
                          color: "var(--success)",
                          background: "rgba(240,160,48,0.05)",
                          padding: "0.4rem",
                          borderRadius: 4,
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {state.result}
                      </pre>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Execute button */}
      <button
        onClick={execute}
        disabled={executing || selected.size === 0}
        style={{
          padding: "0.6rem 1.5rem",
          background: executing ? "rgba(232,114,42,0.3)" : "var(--accent-spice)",
          border: "1px solid var(--accent-spice)",
          borderRadius: 8,
          color: "var(--bg-primary)",
          fontFamily: "var(--font-heading)",
          fontSize: "0.9rem",
          fontWeight: 700,
          cursor: executing ? "default" : "pointer",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {executing ? "Executing..." : "Execute .read()"}
      </button>
    </div>
  );
}
