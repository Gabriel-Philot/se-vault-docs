import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import type {
  MemoryTraceResponse,
  StepResponse,
  TraceLanguage,
} from "../lib/types";

export function useMemoryTrace() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<StepResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const cache = useRef<Map<number, StepResponse>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizeApiError = useCallback((err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const lower = raw.toLowerCase();

    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return {
        message: "Memory backend is unreachable.",
        hint: "Start or restart the API service, then run Trace again.",
      };
    }
    if (lower.includes("503") || lower.includes("sandbox") || lower.includes("container")) {
      return {
        message: "Memory tracing sandbox is unavailable.",
        hint: "Check sandbox containers, then retry the trace.",
      };
    }
    if (lower.includes("500")) {
      return {
        message: "Memory backend hit an internal error.",
        hint: "Retry once. If it fails again, inspect API logs for traceback details.",
      };
    }

    return {
      message: raw || "Memory trace request failed.",
      hint: "Check your code and retry. If the issue persists, inspect backend logs.",
    };
  }, []);

  const fetchStep = useCallback(
    async (sid: string, step: number) => {
      const cached = cache.current.get(step);
      if (cached) {
        setStepData(cached);
        return;
      }
      try {
        const res = await apiFetch<StepResponse>(
          `/api/memory/step/${encodeURIComponent(sid)}?step=${step}`
        );
        cache.current.set(step, res);
        setStepData(res);
        setBackendStatus("ok");
      } catch (err) {
        const normalized = normalizeApiError(err);
        setError(normalized.message);
        setErrorHint(normalized.hint);
        setBackendStatus("error");
      }
    },
    [normalizeApiError]
  );

  const startTrace = useCallback(
    async (code: string, lang: TraceLanguage) => {
      setLoading(true);
      setError(null);
      setErrorHint(null);
      setBackendStatus("loading");
      setIsPlaying(false);
      cache.current.clear();
      try {
        const endpoint =
          lang === "c" ? "/api/memory/trace-c" : "/api/memory/trace-py";
        const res = await apiFetch<MemoryTraceResponse>(endpoint, {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        setSessionId(res.session_id);
        setTotalSteps(res.total_steps);
        setCurrentStep(0);
        await fetchStep(res.session_id, 0);
      } catch (err) {
        const normalized = normalizeApiError(err);
        setError(normalized.message);
        setErrorHint(normalized.hint);
        setBackendStatus("error");
      } finally {
        setLoading(false);
      }
    },
    [fetchStep, normalizeApiError]
  );

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !sessionId) return;

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 1000 / speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, sessionId, totalSteps, speed]);

  // Fetch step data whenever currentStep changes (driven by interval or manual)
  useEffect(() => {
    if (sessionId) fetchStep(sessionId, currentStep);
  }, [sessionId, currentStep, fetchStep]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const stepForward = useCallback(() => {
    if (!sessionId || currentStep >= totalSteps - 1) return;
    setCurrentStep(currentStep + 1);
  }, [sessionId, currentStep, totalSteps]);

  const stepBack = useCallback(() => {
    if (!sessionId || currentStep <= 0) return;
    setCurrentStep(currentStep - 1);
  }, [sessionId, currentStep]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  return {
    startTrace,
    sessionId,
    totalSteps,
    currentStep,
    stepData,
    isPlaying,
    speed,
    loading,
    error,
    errorHint,
    backendStatus,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    setSpeed,
  };
}
