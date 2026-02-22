import { useEffect, useRef, useState } from "react";

interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
}

export function usePollingResource<T>(fetcher: () => Promise<T>, intervalMs: number, enabled = true): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdatedAt: null
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let alive = true;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const data = await fetcherRef.current();
        if (!alive) return;
        setState({
          data,
          loading: false,
          error: null,
          lastUpdatedAt: new Date().toISOString()
        });
      } catch (err) {
        if (!alive) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error"
        }));
      } finally {
        if (alive) {
          timer = window.setTimeout(tick, intervalMs);
        }
      }
    };

    void tick();

    return () => {
      alive = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [enabled, intervalMs]);

  return state;
}
