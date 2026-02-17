import { useState, useCallback, useRef } from 'react';
import type { DatasetEvent } from '../types/race';

export interface DatasetInfo {
  rows: number;
  columns: string[];
  size_mb: number;
}

export type DatasetStatus = 'checking' | 'missing' | 'ready' | 'generating' | 'error';

export function useDatasetGen() {
  const [status, setStatus] = useState<DatasetStatus>('checking');
  const [progress, setProgress] = useState(0);
  const [rowsGenerated, setRowsGenerated] = useState(0);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const checkDataset = useCallback(async () => {
    try {
      const res = await fetch('/api/dataset/info');
      if (res.ok) {
        const info: DatasetInfo = await res.json();
        setDatasetInfo(info);
        setStatus('ready');
        setProgress(100);
      } else if (res.status === 404) {
        setStatus('missing');
      } else {
        setStatus('error');
        setError(`Failed to check dataset: ${res.status}`);
      }
    } catch {
      setStatus('error');
      setError('Cannot reach API');
    }
  }, []);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('generating');
    setProgress(0);
    setRowsGenerated(0);
    setError(null);

    try {
      const response = await fetch('/api/dataset/generate', {
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const detail = response.status === 409
          ? 'Generation already in progress or race is running'
          : `Server error: ${response.status}`;
        setError(detail);
        setStatus('error');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
                const data = JSON.parse(line.slice(6)) as DatasetEvent;
                if (data.event === 'progress') {
                  setProgress(data.percent);
                  setRowsGenerated(data.rows);
                } else if (data.event === 'completed') {
                  setProgress(100);
                  setRowsGenerated(data.rows);
                  setDatasetInfo({
                    rows: data.rows,
                    columns: [],
                    size_mb: data.size_mb,
                  });
                  setStatus('ready');
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
        setError('Connection lost during generation');
        setStatus('error');
      }
    }
  }, []);

  return { status, progress, rowsGenerated, datasetInfo, error, checkDataset, generate };
}
