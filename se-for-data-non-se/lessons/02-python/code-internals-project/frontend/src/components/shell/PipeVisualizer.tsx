import type { ShellEvent } from "../../lib/types";

interface PipeVisualizerProps {
  command: string;
  events: ShellEvent[];
}

export function PipeVisualizer({ command, events }: PipeVisualizerProps) {
  const stages = command.split("|").map((s) => s.trim());

  if (stages.length <= 1) return null;

  return (
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4">
      <h3 className="text-sm font-medium text-ci-muted mb-3">Pipeline</h3>
      <div className="flex items-center gap-2 overflow-x-auto">
        {stages.map((stage, i) => {
          const stageEvents = events.filter((e) => e.pipe_stage === i);
          return (
            <div key={i} className="flex items-center">
              <div className="bg-ci-surface rounded-lg border border-ci-border p-3 min-w-[120px]">
                <div className="text-xs font-mono text-ci-green mb-1">
                  {stage}
                </div>
                <div className="text-[10px] text-ci-dim">
                  {stageEvents.length} events
                </div>
              </div>
              {i < stages.length - 1 && (
                <span className="text-ci-dim mx-2 text-lg">&rarr;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
