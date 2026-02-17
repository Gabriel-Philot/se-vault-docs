import { useState, useCallback, useRef } from 'react';
import type { RunnerName, RunnerState, RaceEvent } from '../types/race';

const TOTAL_STAGES = 3;

function createInitialState(): RunnerState {
  return {
    currentStage: 0,
    stageStatus: 'idle',
    memory_mb: 0,
    peak_memory_mb: 0,
    stageTimes: [],
    totalTime: null,
    finished: false,
    progress: 0,
  };
}

function createInitialRunners(): Record<RunnerName, RunnerState> {
  return {
    'pure-python': createInitialState(),
    pandas: createInitialState(),
    polars: createInitialState(),
    duckdb: createInitialState(),
  };
}

function computeProgress(state: RunnerState): number {
  if (state.finished) return 1;
  if (state.currentStage === 0) return 0;
  const completedStages = state.stageStatus === 'completed' ? state.currentStage : state.currentStage - 1;
  const inProgress = state.stageStatus === 'started' ? 0.5 : 0;
  return (completedStages + inProgress) / TOTAL_STAGES;
}

export function useRaceSSE() {
  const [runners, setRunners] = useState<Record<RunnerName, RunnerState>>(createInitialRunners);
  const [isRacing, setIsRacing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishOrder, setFinishOrder] = useState<RunnerName[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const processEvent = useCallback((evt: RaceEvent) => {
    if (evt.event === 'stage') {
      setRunners((prev) => {
        const runner = prev[evt.runner];
        const updated: RunnerState = {
          ...runner,
          currentStage: evt.stage,
          stageStatus: evt.status,
          memory_mb: evt.memory_mb,
          peak_memory_mb: Math.max(runner.peak_memory_mb, evt.memory_mb),
          stageTimes:
            evt.status === 'completed' && evt.elapsed_ms != null
              ? [...runner.stageTimes, evt.elapsed_ms]
              : runner.stageTimes,
        };
        updated.progress = computeProgress(updated);
        return { ...prev, [evt.runner]: updated };
      });
    } else if (evt.event === 'finished') {
      setRunners((prev) => {
        const updated: RunnerState = {
          ...prev[evt.runner],
          finished: true,
          totalTime: evt.total_ms,
          peak_memory_mb: evt.peak_memory_mb,
          progress: 1,
        };
        return { ...prev, [evt.runner]: updated };
      });
      setFinishOrder((prev) =>
        prev.includes(evt.runner) ? prev : [...prev, evt.runner]
      );
    } else if (evt.event === 'error') {
      console.error(`Runner ${evt.runner} error: ${evt.status}`);
      // Mark errored runner as finished so the race doesn't hang
      setRunners((prev) => {
        const updated: RunnerState = {
          ...prev[evt.runner],
          finished: true,
          totalTime: -1,
          progress: 1,
        };
        return { ...prev, [evt.runner]: updated };
      });
      setFinishOrder((prev) =>
        prev.includes(evt.runner) ? prev : [...prev, evt.runner]
      );
    }
    // 'race_finished' events are ignored; we track finish per-runner
  }, []);

  const startRace = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunners(createInitialRunners());
    setFinishOrder([]);
    setIsRacing(true);
    setIsFinished(false);

    try {
      const response = await fetch('/api/race/start', {
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        setIsRacing(false);
        console.error(`Race start failed: ${response.status}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finishedCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const msg of messages) {
          const lines = msg.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as RaceEvent;
                processEvent(data);
                if (data.event === 'finished' || data.event === 'error') {
                  finishedCount++;
                  if (finishedCount >= 4) {
                    setIsRacing(false);
                    setIsFinished(true);
                  }
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Race SSE error:', err);
      }
    } finally {
      setIsRacing(false);
      setIsFinished(true);
    }
  }, [processEvent]);

  return { runners, isRacing, isFinished, startRace, finishOrder };
}
