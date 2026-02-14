import { RUNNERS } from '../types/race';
import type { RunnerName, RunnerState } from '../types/race';

interface Props {
  runners: Record<RunnerName, RunnerState>;
  finishOrder: RunnerName[];
  show: boolean;
  onClose: () => void;
}

const NOTES: Record<RunnerName, string> = {
  'pure-python':
    'Slowest due to no vectorization. Each row processed individually through Python\'s interpreter, creating Python objects for every value. This is what happens when you loop over DataFrames row by row.',
  pandas:
    'Good performance but highest memory. DataFrames create copies during operations, and the object dtype adds overhead. Still much faster than pure Python thanks to NumPy\'s C backend.',
  polars:
    'Fast and memory-efficient. Written in Rust with Apache Arrow memory format. Lazy evaluation optimizes the query plan before execution.',
  duckdb:
    'SQL-based processing with columnar engine. Streams data instead of loading everything into memory, explaining its low memory footprint.',
};

export default function ResultsModal({ runners, finishOrder, show, onClose }: Props) {
  if (!show) return null;

  const allFinished = finishOrder.length >= 4;
  if (!allFinished) return null;

  const winner = finishOrder[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" data-testid="results-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">Race Results</h2>
        <p className="modal-subtitle">
          Winner:{' '}
          <span style={{ color: RUNNERS.find((r) => r.name === winner)?.color }}>
            {RUNNERS.find((r) => r.name === winner)?.label}
          </span>
          {' \uD83C\uDFC6'}
        </p>

        <table className="results-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Runner</th>
              <th>Total Time</th>
              <th>Peak Memory</th>
            </tr>
          </thead>
          <tbody>
            {finishOrder.map((name, i) => {
              const cfg = RUNNERS.find((r) => r.name === name)!;
              const state = runners[name];
              return (
                <tr key={name} className={i === 0 ? 'winner-row' : ''}>
                  <td>{i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`}</td>
                  <td style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</td>
                  <td className="mono">{state.totalTime != null ? `${(state.totalTime / 1000).toFixed(2)}s` : '-'}</td>
                  <td className="mono">{state.peak_memory_mb.toFixed(1)} MB</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="notes-section">
          <h3>What happened?</h3>
          {finishOrder.map((name) => {
            const cfg = RUNNERS.find((r) => r.name === name)!;
            return (
              <div key={name} className="note-card">
                <span className="note-title" style={{ color: cfg.color }}>{cfg.label}</span>
                <p>{NOTES[name]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
