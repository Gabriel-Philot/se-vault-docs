import { RUNNERS } from '../types/race';
import type { RunnerName, RunnerState } from '../types/race';

interface Props {
  runners: Record<RunnerName, RunnerState>;
  finishOrder: RunnerName[];
}

function stageName(stage: number, status: string): string {
  if (stage === 0) return 'Waiting';
  const names = ['Load & Filter', 'Aggregate', 'Join & Sort'];
  const label = names[stage - 1] || `Stage ${stage}`;
  return status === 'started' ? `${label}...` : label;
}

export default function Leaderboard({ runners, finishOrder }: Props) {
  const sorted = [...RUNNERS].sort((a, b) => {
    const sa = runners[a.name];
    const sb = runners[b.name];
    if (sa.finished && sb.finished) {
      return finishOrder.indexOf(a.name) - finishOrder.indexOf(b.name);
    }
    if (sa.finished) return -1;
    if (sb.finished) return 1;
    if (sa.currentStage !== sb.currentStage) return sb.currentStage - sa.currentStage;
    if (sa.stageStatus === 'completed' && sb.stageStatus !== 'completed') return -1;
    if (sb.stageStatus === 'completed' && sa.stageStatus !== 'completed') return 1;
    return 0;
  });

  return (
    <div className="leaderboard panel" data-testid="leaderboard">
      <h3 className="panel-title">Leaderboard</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Runner</th>
            <th>Stage</th>
            <th>Time</th>
            <th>Memory</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((cfg, i) => {
            const state = runners[cfg.name];
            return (
              <tr key={cfg.name} className={state.finished ? 'finished-row' : ''}>
                <td className="pos-cell">
                  {state.finished ? (i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`) : i + 1}
                </td>
                <td>
                  <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                </td>
                <td>{stageName(state.currentStage, state.stageStatus)}</td>
                <td className="mono">
                  {state.totalTime != null
                    ? `${(state.totalTime / 1000).toFixed(2)}s`
                    : state.stageTimes.length > 0
                      ? `${(state.stageTimes.reduce((a, b) => a + b, 0) / 1000).toFixed(2)}s`
                      : '-'}
                </td>
                <td className="mono">{state.memory_mb > 0 ? `${state.memory_mb.toFixed(1)} MB` : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
