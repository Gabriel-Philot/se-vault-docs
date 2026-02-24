import { useCallback, useState } from "react";
import { apiFetch } from "../lib/api";
import type { CompileCResponse, InterpretPythonResponse } from "../lib/types";

export function useCompile() {
  const [cResult, setCResult] = useState<CompileCResponse | null>(null);
  const [pyResult, setPyResult] = useState<InterpretPythonResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const normalizeApiError = useCallback((err: unknown) => {
    const raw = err instanceof Error ? err.message : String(err ?? "");
    const lower = raw.toLowerCase();

    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return {
        message: "Compiler backend is unreachable.",
        hint: "Start or restart the API service, then try Compile/Interpret again.",
      };
    }
    if (lower.includes("503") || lower.includes("sandbox") || lower.includes("container")) {
      return {
        message: "Compiler sandbox is unavailable.",
        hint: "Ensure sandbox containers are running, then retry.",
      };
    }
    if (lower.includes("500")) {
      return {
        message: "Compiler backend hit an internal error.",
        hint: "Check API logs for stack traces and retry with the same snippet.",
      };
    }

    return {
      message: raw || "Compiler request failed.",
      hint: "Review input code and retry. If it persists, inspect backend logs.",
    };
  }, []);

  const compileC = useCallback(async (code: string, optimization: string) => {
    const startedAt = performance.now();
    setLoading(true);
    setError(null);
    setErrorHint(null);
    setBackendStatus("loading");
    try {
      const res = await apiFetch<CompileCResponse>("/api/compile/c", {
        method: "POST",
        body: JSON.stringify({ code, optimization }),
      });
      setCResult(res);
      setBackendStatus("ok");
      return { ok: true, elapsedMs: performance.now() - startedAt, result: res };
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError(normalized.message);
      setErrorHint(normalized.hint);
      setBackendStatus("error");
      return { ok: false, elapsedMs: performance.now() - startedAt, result: null };
    } finally {
      setLoading(false);
    }
  }, [normalizeApiError]);

  const interpretPython = useCallback(async (code: string) => {
    const startedAt = performance.now();
    setLoading(true);
    setError(null);
    setErrorHint(null);
    setBackendStatus("loading");
    try {
      const res = await apiFetch<InterpretPythonResponse>(
        "/api/interpret/python",
        {
          method: "POST",
          body: JSON.stringify({ code }),
        }
      );
      setPyResult(res);
      setBackendStatus("ok");
      return { ok: true, elapsedMs: performance.now() - startedAt, result: res };
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError(normalized.message);
      setErrorHint(normalized.hint);
      setBackendStatus("error");
      return { ok: false, elapsedMs: performance.now() - startedAt, result: null };
    } finally {
      setLoading(false);
    }
  }, [normalizeApiError]);

  return {
    compileC,
    interpretPython,
    cResult,
    pyResult,
    loading,
    error,
    errorHint,
    backendStatus,
  };
}
