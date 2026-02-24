import type { ShellEvent } from "../../lib/types";

interface StreamVisualizerProps {
  events: ShellEvent[];
}

const PIPES: Array<{
  stream: string;
  label: string;
  labelClass: string;
  valueClass: string;
  panelClass: string;
  emptyLabel: string;
}> = [
  {
    stream: "stdin",
    label: "stdin",
    labelClass: "text-ci-green",
    valueClass: "text-ci-green",
    panelClass: "bg-ci-green/6 border-ci-green/20",
    emptyLabel: "No input bytes written",
  },
  {
    stream: "stdout",
    label: "stdout",
    labelClass: "text-ci-text",
    valueClass: "text-ci-text",
    panelClass: "bg-ci-surface border-ci-border",
    emptyLabel: "No standard output yet",
  },
  {
    stream: "stderr",
    label: "stderr",
    labelClass: "text-ci-red",
    valueClass: "text-ci-red",
    panelClass: "bg-ci-red/6 border-ci-red/20",
    emptyLabel: "No errors emitted",
  },
];

export function StreamVisualizer({ events }: StreamVisualizerProps) {
  const grouped = PIPES.map(({ stream, label, labelClass, valueClass, panelClass, emptyLabel }) => ({
    label,
    labelClass,
    valueClass,
    panelClass,
    emptyLabel,
    data: events.filter((e) => e.stream === stream),
  }));

  return (
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/15">
      <h3 className="text-sm font-medium text-ci-muted mb-3">
        Stream Pipes
      </h3>
      {events.length === 0 && (
        <div className="mb-3 rounded-lg border border-dashed border-ci-border bg-ci-panel/60 px-3 py-2 text-xs text-ci-dim">
          Run a command to watch stdin/stdout/stderr activity in real time.
        </div>
      )}
      <div className="space-y-2.5">
        {grouped.map(({ label, labelClass, valueClass, panelClass, emptyLabel, data }) => (
          <div key={label} className="group flex items-start gap-2">
            <span
              className={
                "w-14 shrink-0 pt-1 text-xs font-semibold tracking-wide " +
                labelClass
              }
            >
              {label}
            </span>
            <div
              className={
                "min-h-[32px] max-h-24 flex-1 overflow-auto rounded-lg border p-2 text-xs font-mono transition-colors duration-200 group-hover:border-ci-muted/45 " +
                panelClass +
                " " +
                valueClass
              }
            >
              {data.map((e, i) => (
                <div key={i}>{e.data}</div>
              ))}
              {data.length === 0 && (
                <span className="text-ci-dim">{emptyLabel}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
