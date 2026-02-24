import { useCallback, useEffect, useRef, useState } from "react";
import { createSSEReader } from "../lib/api";
import type { ShellEvent, SSEStatus } from "../lib/types";

export function useSSE(path: string, body: Record<string, unknown> | null) {
  const [events, setEvents] = useState<ShellEvent[]>([]);
  const [status, setStatus] = useState<SSEStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const normalizeSSEError = useCallback((err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const lower = raw.toLowerCase();

    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return "Shell backend is unavailable. Start or restart the API service, then run the command again.";
    }
    if (lower.includes("sse 503") || lower.includes("container") || lower.includes("sandbox")) {
      return "Shell sandbox is not ready. Verify sandbox containers are running, then retry.";
    }
    if (lower.includes("sse 500")) {
      return "Shell backend hit an internal error. Check API logs and retry the command.";
    }
    if (lower.includes("no response body")) {
      return "Shell backend returned an empty stream. Retry once and check backend health if this persists.";
    }

    return `Shell request failed: ${raw || "Unknown error"}`;
  }, []);

  useEffect(() => {
    if (!body) return;

    controllerRef.current?.abort();
    setStatus("streaming");
    setError(null);

    let completed = false;
    const controller = createSSEReader(
      path,
      body,
      (event) => setEvents((prev) => [...prev, event]),
      () => {
        completed = true;
        setStatus("done");
      },
      (err) => {
        completed = true;
        setError(normalizeSSEError(err));
        setStatus("error");
      }
    );

    const timeoutId = setTimeout(() => {
      if (completed) return;
      controller.abort();
      setError(
        "Shell backend timed out while streaming output. Confirm the API and sandbox are running, then retry."
      );
      setStatus("error");
    }, 17000);

    controllerRef.current = controller;

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [path, body, normalizeSSEError]);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    setEvents([]);
    setStatus("idle");
    setError(null);
  }, []);

  return { events, status, error, clear };
}
