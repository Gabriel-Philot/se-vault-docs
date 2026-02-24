import { useEffect, useRef } from "react";
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
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4 font-mono text-sm max-h-64 overflow-auto">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-ci-muted">Shell stream</span>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>
      {error && (
        <div className="mb-3 rounded-md border border-ci-red/30 bg-ci-red/10 p-2 text-xs text-ci-red">
          {error}
        </div>
      )}
      {events.length === 0 && status === "idle" && (
        <span className="text-ci-dim">Output will appear here...</span>
      )}
      {events.map((evt, i) => (
        <div key={i} className={STREAM_COLORS[evt.stream] ?? "text-ci-text"}>
          {evt.data}
        </div>
      ))}
      {status === "streaming" && (
        <span className="inline-block w-2 h-4 bg-ci-green animate-pulse" />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
