export type RunnerName = 'pure-python' | 'pandas' | 'polars' | 'duckdb';

export interface RunnerConfig {
  name: RunnerName;
  label: string;
  color: string;
}

export const RUNNERS: RunnerConfig[] = [
  { name: 'pure-python', label: 'Pure Python', color: '#FFD43B' },
  { name: 'pandas', label: 'Pandas', color: '#6366F1' },
  { name: 'polars', label: 'Polars', color: '#E4553D' },
  { name: 'duckdb', label: 'DuckDB', color: '#FFC107' },
];

export interface StageEvent {
  event: 'stage';
  runner: RunnerName;
  stage: number;
  status: 'started' | 'completed';
  memory_mb: number;
  elapsed_ms?: number;
}

export interface FinishEvent {
  event: 'finished';
  runner: RunnerName;
  total_ms: number;
  peak_memory_mb: number;
}

export interface ErrorEvent {
  event: 'error';
  runner: RunnerName;
  status: string;
}

export interface RaceFinishedEvent {
  event: 'race_finished';
  results: unknown[];
}

export type RaceEvent = StageEvent | FinishEvent | ErrorEvent | RaceFinishedEvent;

export interface DatasetProgressEvent {
  event: 'progress';
  rows: number;
  total: number;
  percent: number;
}

export interface DatasetCompletedEvent {
  event: 'completed';
  rows: number;
  size_mb: number;
  elapsed_s: number;
}

export type DatasetEvent = DatasetProgressEvent | DatasetCompletedEvent;

export interface RunnerState {
  currentStage: number;
  stageStatus: 'idle' | 'started' | 'completed';
  memory_mb: number;
  peak_memory_mb: number;
  stageTimes: number[];
  totalTime: number | null;
  finished: boolean;
  progress: number;
}
