import { RUNNERS } from '../types/race';
import type { RunnerName, RunnerState } from '../types/race';

interface Props {
  runners: Record<RunnerName, RunnerState>;
}

const STAGE_NAMES = ['Load & Filter', 'Aggregate', 'Join & Sort'];

function StageIcon({ stage, runner }: { stage: number; runner: RunnerState }) {
  if (runner.currentStage > stage) {
    return <span className="stage-done" title="Completed">&check;</span>;
  }
  if (runner.currentStage === stage && runner.stageStatus === 'started') {
    return <span className="stage-active" title="In progress">&bull;</span>;
  }
  if (runner.currentStage === stage && runner.stageStatus === 'completed') {
    return <span className="stage-done" title="Completed">&check;</span>;
  }
  return <span className="stage-pending" title="Pending">&#9675;</span>;
}

export default function StageIndicator({ runners }: Props) {
  return (
    <div className="stage-indicator panel">
      <h3 className="panel-title">Stage Progress</h3>
      {RUNNERS.map((cfg) => {
        const state = runners[cfg.name];
        return (
          <div key={cfg.name} className="stage-runner-row">
            <span className="stage-runner-label" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <div className="stage-pills">
              {STAGE_NAMES.map((name, i) => (
                <div key={i} className="stage-pill">
                  <StageIcon stage={i + 1} runner={state} />
                  <span className="stage-pill-label">{name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
