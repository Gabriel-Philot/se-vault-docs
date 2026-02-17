import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "motion/react";

interface Stage {
  stage_type: string;
  class_name: string;
  config: Record<string, string>;
}

interface StageState {
  status: "idle" | "running" | "done" | "error";
  message: string;
  result: string | null;
}

interface PipelineBuilderProps {
  onCodeChange: (code: string, rawCode?: string, factoryCode?: string) => void;
  resetKey?: number;
}

const STAGE_PALETTE: Stage[] = [
  { stage_type: "source", class_name: "CsvSource", config: { path: "data.csv" } },
  { stage_type: "source", class_name: "ParquetSource", config: { path: "data.parquet" } },
  { stage_type: "source", class_name: "ApiSource", config: { url: "https://api.example.com/data" } },
  { stage_type: "transform", class_name: "FilterTransform", config: { column: "id", op: ">", value: "0" } },
  { stage_type: "transform", class_name: "MapTransform", config: { column: "name", fn: "upper" } },
  { stage_type: "transform", class_name: "AggregateTransform", config: { fn: "mean" } },
  { stage_type: "sink", class_name: "ConsoleSink", config: {} },
  { stage_type: "sink", class_name: "FileSink", config: { path: "output.csv" } },
  { stage_type: "sink", class_name: "DatabaseSink", config: { table: "results" } },
];

const TYPE_COLORS: Record<string, string> = {
  source: "var(--accent-fremen)",
  transform: "var(--accent-spice)",
  sink: "var(--success)",
};

let nodeId = 0;

export default function PipelineBuilder({ onCodeChange, resetKey }: PipelineBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageStates, setStageStates] = useState<Record<number, StageState>>({});
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Swap form
  const [swapIndex, setSwapIndex] = useState("0");
  const [swapClass, setSwapClass] = useState("");
  const lastNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (resetKey === undefined || resetKey === 0) return;
    setNodes([]);
    setEdges([]);
    setPipelineId(null);
    setStages([]);
    setStageStates({});
    setRunning(false);
    setLoading(false);
    setMessage(null);
    setSwapIndex("0");
    setSwapClass("");
    lastNodeIdRef.current = null;
  }, [resetKey, setNodes, setEdges]);

  const addStage = (stage: Stage) => {
    const id = `stage-${nodeId++}`;
    const prevId = lastNodeIdRef.current;
    lastNodeIdRef.current = id;

    setNodes((prev) => {
      const index = prev.length;
      const newNode: Node = {
        id,
        position: { x: index * 220 + 40, y: 120 },
        data: {
          label: stage.class_name,
          stageType: stage.stage_type,
        },
        style: {
          background: "var(--bg-secondary)",
          border: `1px solid ${TYPE_COLORS[stage.stage_type] ?? "var(--accent-spice)"}`,
          borderRadius: 8,
          padding: "8px 16px",
          color: TYPE_COLORS[stage.stage_type] ?? "var(--text-primary)",
          fontFamily: "var(--font-heading)",
          fontSize: "0.85rem",
          fontWeight: 600,
          boxShadow: `0 0 10px ${TYPE_COLORS[stage.stage_type] ?? "var(--accent-spice)"}33`,
        },
      };
      return [...prev, newNode];
    });
    setStages((prev) => [...prev, stage]);

    // Auto-connect to previous node using ref (always fresh)
    if (prevId) {
      setEdges((prev) => [
        ...prev,
        {
          id: `${prevId}->${id}`,
          source: prevId,
          target: id,
          animated: true,
          style: { stroke: "var(--accent-spice)", strokeWidth: 2 },
        },
      ]);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "var(--accent-spice)", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const buildPipeline = async () => {
    if (stages.length === 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pipeline/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPipelineId(data.pipeline_id);
      onCodeChange(data.python_code, data.raw_code, data.factory_code);
      setMessage(data.message);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to build");
    } finally {
      setLoading(false);
    }
  };

  const runPipeline = async () => {
    if (!pipelineId) return;
    setRunning(true);
    setStageStates({});

    try {
      const res = await fetch(`/api/pipeline/run?pipeline_id=${pipelineId}`, {
        method: "POST",
      });
      if (!res.ok || !res.body) {
        setRunning(false);
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
              const idx = event.stage_index;

              setStageStates((prev) => ({
                ...prev,
                [idx]: {
                  status:
                    event.event_type === "result"
                      ? "done"
                      : event.event_type === "error"
                        ? "error"
                        : "running",
                  message: event.message,
                  result: event.data ?? null,
                },
              }));

              // Highlight the active node
              setNodes((prev) =>
                prev.map((n, i) => ({
                  ...n,
                  style: {
                    ...n.style,
                    boxShadow:
                      i === idx
                        ? event.event_type === "result"
                          ? "0 0 20px rgba(240,160,48,0.6)"
                          : "0 0 20px rgba(232,114,42,0.5)"
                        : (n.style?.boxShadow ?? "none"),
                  },
                }))
              );
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  const swapStage = async () => {
    if (!pipelineId || !swapClass) return;
    const idx = parseInt(swapIndex);
    if (isNaN(idx) || idx < 0 || idx >= stages.length) return;

    setLoading(true);
    try {
      const oldStage = stages[idx];
      const newStage: Stage = {
        stage_type: oldStage.stage_type,
        class_name: swapClass,
        config: STAGE_PALETTE.find((s) => s.class_name === swapClass)?.config ?? {},
      };

      const res = await fetch("/api/pipeline/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          stage_index: idx,
          new_stage: newStage,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onCodeChange(data.python_code, data.raw_code, data.factory_code);
      setMessage(data.message);

      // Update local state
      setStages((prev) =>
        prev.map((s, i) => (i === idx ? newStage : s))
      );
      setNodes((prev) =>
        prev.map((n, i) =>
          i === idx
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: swapClass,
                  stageType: newStage.stage_type,
                },
                style: {
                  ...n.style,
                  border: `1px solid ${TYPE_COLORS[newStage.stage_type] ?? "var(--accent-spice)"}`,
                  color: TYPE_COLORS[newStage.stage_type] ?? "var(--text-primary)",
                },
              }
            : n
        )
      );
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to swap");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.35rem 0.5rem",
    background: "var(--code-bg)",
    border: "1px solid rgba(232,114,42,0.15)",
    borderRadius: 4,
    color: "var(--text-primary)",
    fontFamily: "var(--font-code)",
    fontSize: "0.72rem",
    outline: "none",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
            margin: 0,
          }}
        >
          Pipeline Builder
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            marginTop: "0.3rem",
          }}
        >
          Build a data pipeline with Factory pattern. Add stages, connect them,
          run and watch data flow. Swap stages to see polymorphism in action.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Stage palette */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid rgba(232,114,42,0.12)",
            borderRadius: 8,
            padding: "0.6rem",
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              color: "var(--accent-spice)",
              margin: "0 0 0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Stages
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {STAGE_PALETTE.map((stage) => (
              <motion.button
                key={stage.class_name}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addStage(stage)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.5rem",
                  background: "transparent",
                  border: `1px solid ${TYPE_COLORS[stage.stage_type]}44`,
                  borderRadius: 5,
                  color: TYPE_COLORS[stage.stage_type],
                  fontFamily: "var(--font-code)",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    opacity: 0.7,
                    minWidth: 32,
                  }}
                >
                  {stage.stage_type.slice(0, 3)}
                </span>
                {stage.class_name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* React Flow canvas */}
        <div
          style={{
            height: 320,
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
            onConnect={onConnect}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: "var(--bg-primary)" }}
          >
            <Background color="rgba(232,114,42,0.06)" gap={20} />
          </ReactFlow>
        </div>
      </div>

      {/* Action buttons row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "end" }}>
        <button
          onClick={buildPipeline}
          disabled={loading || stages.length === 0}
          style={{
            padding: "0.5rem 1rem",
            background:
              stages.length === 0 ? "rgba(232,114,42,0.2)" : "var(--accent-spice)",
            border: "1px solid var(--accent-spice)",
            borderRadius: 6,
            color: "var(--bg-primary)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: stages.length === 0 ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Building..." : "Build Pipeline"}
        </button>

        <button
          onClick={runPipeline}
          disabled={!pipelineId || running}
          style={{
            padding: "0.5rem 1rem",
            background: pipelineId ? "var(--success)" : "rgba(240,160,48,0.2)",
            border: "1px solid var(--success)",
            borderRadius: 6,
            color: "var(--bg-primary)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: !pipelineId ? "default" : "pointer",
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? "Running..." : "Run Pipeline"}
        </button>

        {/* Swap stage controls */}
        {pipelineId && (
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-heading)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Swap:
            </span>
            <input
              type="number"
              value={swapIndex}
              onChange={(e) => setSwapIndex(e.target.value)}
              min={0}
              max={stages.length - 1}
              style={{ ...inputStyle, width: 40 }}
              title="Stage index"
            />
            <select
              value={swapClass}
              onChange={(e) => setSwapClass(e.target.value)}
              style={{ ...inputStyle, minWidth: 120 }}
            >
              <option value="">Select class...</option>
              {STAGE_PALETTE.map((s) => (
                <option key={s.class_name} value={s.class_name}>
                  {s.class_name}
                </option>
              ))}
            </select>
            <button
              onClick={swapStage}
              disabled={!swapClass || loading}
              style={{
                padding: "0.35rem 0.6rem",
                background: "rgba(45,125,210,0.15)",
                border: "1px solid var(--accent-fremen)",
                borderRadius: 4,
                color: "var(--accent-fremen)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: !swapClass ? "default" : "pointer",
              }}
            >
              Swap
            </button>
          </div>
        )}
      </div>

      {/* Stage execution results */}
      {Object.keys(stageStates).length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {Object.entries(stageStates).map(([idx, state]) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.6rem",
                background:
                  state.status === "done"
                    ? "rgba(240,160,48,0.06)"
                    : state.status === "error"
                      ? "rgba(192,57,43,0.06)"
                      : "rgba(232,114,42,0.04)",
                borderRadius: 4,
                fontSize: "0.72rem",
                fontFamily: "var(--font-code)",
              }}
            >
              {state.status === "running" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "2px solid var(--accent-spice)",
                    borderTopColor: "transparent",
                  }}
                />
              )}
              {state.status === "done" && (
                <span style={{ color: "var(--success)" }}>●</span>
              )}
              {state.status === "error" && (
                <span style={{ color: "var(--error)" }}>●</span>
              )}
              <span style={{ color: "var(--text-secondary)" }}>
                {state.message}
              </span>
              {state.result && (
                <span style={{ color: "var(--code-text)", marginLeft: "auto" }}>
                  {state.result}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.8rem",
              background: "rgba(240,160,48,0.08)",
              border: "1px solid rgba(240,160,48,0.2)",
              borderRadius: 6,
              color: "var(--success)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-code)",
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
