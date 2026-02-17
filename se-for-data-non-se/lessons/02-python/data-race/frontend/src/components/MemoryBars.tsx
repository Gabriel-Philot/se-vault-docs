import { RUNNERS } from '../types/race';
import type { RunnerName, RunnerState } from '../types/race';

interface Props {
  runners: Record<RunnerName, RunnerState>;
}

export default function MemoryBars({ runners }: Props) {
  const maxMemory = Math.max(
    1,
    ...RUNNERS.map((r) => runners[r.name].peak_memory_mb)
  );

  return (
    <div className="memory-bars panel" data-testid="memory-bars">
      <h3 className="panel-title">Memory Usage</h3>
      {RUNNERS.map((cfg) => {
        const state = runners[cfg.name];
        const pct = (state.memory_mb / maxMemory) * 100;
        return (
          <div key={cfg.name} className="memory-row">
            <span className="memory-label" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <div className="memory-track">
              <div
                className="memory-fill"
                style={{
                  width: `${pct}%`,
                  backgroundColor: cfg.color,
                  boxShadow: `0 0 10px ${cfg.color}60`,
                }}
              />
            </div>
            <span className="memory-value">{state.memory_mb.toFixed(1)} MB</span>
          </div>
        );
      })}
    </div>
  );
}
