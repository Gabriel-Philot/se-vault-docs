import { useEffect, useRef } from "react";
import { AlertTriangle, RadioTower, TerminalSquare } from "lucide-react";
import type { ShellEvent, SSEStatus } from "../../lib/types";

interface StreamOutputProps {
  events: ShellEvent[];
  status: SSEStatus;
  error?: string | null;
}

const STREAM_COLORS: Record<string, string> = {
  stdout: "text-ci-text",
  stderr: "text-ci-red",
  system: "text-ci-muted",
};

const STREAM_LABELS: Record<string, string> = {
  stdout: "out",
  stderr: "err",
  system: "sys",
};

export function StreamOutput({ events, status, error }: StreamOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const statusLabel =
    status === "streaming"
      ? "Streaming"
      : status === "done"
        ? "Complete"
        : status === "error"
          ? "Error"
          : "Idle";

  const statusClasses =
    status === "streaming"
      ? "border-ci-blue/40 bg-ci-blue/15 text-ci-blue"
      : status === "done"
        ? "border-ci-green/40 bg-ci-green/15 text-ci-green"
        : status === "error"
          ? "border-ci-red/40 bg-ci-red/15 text-ci-red"
          : "border-ci-border bg-ci-surface text-ci-dim";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="relative max-h-72 overflow-auto rounded-xl border border-ci-border bg-ci-panel p-4 font-mono text-sm shadow-lg shadow-black/10">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-ci-cyan/35 to-transparent" />
      <div className="relative mb-3 flex items-center justify-between gap-3 border-b border-ci-border pb-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-ci-muted">
          <TerminalSquare size={13} className="text-ci-green" />
          Shell stream
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusClasses}`}>
          <RadioTower size={11} />
          {statusLabel}
        </span>
      </div>
      {error && (
        <div className="relative mb-3 rounded-md border border-ci-red/30 bg-ci-red/10 p-2 text-xs text-ci-red">
          <span className="mb-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide">
            <AlertTriangle size={11} />
            stream error
          </span>
          {error}
        </div>
      )}
      {events.length === 0 && status === "idle" && (
        <span className="text-ci-dim">Output will appear here...</span>
      )}
      {events.map((evt, i) => (
        <div
          key={i}
          className={`grid grid-cols-[auto_1fr] gap-2 ${STREAM_COLORS[evt.stream] ?? "text-ci-text"}`}
        >
          <span className="text-[10px] uppercase tracking-wide text-ci-dim">
            {STREAM_LABELS[evt.stream] ?? "log"}
          </span>
          {evt.data}
        </div>
      ))}
      {status === "streaming" && (
        <span className="inline-block h-4 w-2 rounded-xs bg-ci-green animate-cursor-blink" />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
