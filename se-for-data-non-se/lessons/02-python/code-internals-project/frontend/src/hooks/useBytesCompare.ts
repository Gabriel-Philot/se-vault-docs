import { useCallback, useState } from "react";
import { apiFetch } from "../lib/api";
import type {
  BytesCompareRequest,
  BytesCompareResponse,
  BytesEncodeRequest,
  BytesEncodeResponse,
} from "../lib/types";

export function useBytesCompare() {
  const [compareResult, setCompareResult] =
    useState<BytesCompareResponse | null>(null);
  const [encodeResult, setEncodeResult] =
    useState<BytesEncodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (req: BytesCompareRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BytesCompareResponse>("/api/bytes/compare", {
        method: "POST",
        body: JSON.stringify(req),
      });
      setCompareResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const encodeText = useCallback(async (req: BytesEncodeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BytesEncodeResponse>("/api/bytes/encode", {
        method: "POST",
        body: JSON.stringify(req),
      });
      setEncodeResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { compare, encodeText, compareResult, encodeResult, loading, error };
}
