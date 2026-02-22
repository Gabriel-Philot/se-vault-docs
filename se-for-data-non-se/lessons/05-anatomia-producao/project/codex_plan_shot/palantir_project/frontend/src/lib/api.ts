import type {
  ApiFailure,
  ApiSuccess,
  DiagramEnvelope,
  GateKnockEnvelope,
  GateStatsEnvelope,
  HealthEnvelope,
  LeaderboardEnvelope,
  MissionBatchResponse,
  MissionListEnvelope,
  MissionSummary,
  MissionTracesEnvelope,
  RegionEnvelope,
  SqlQueryResultEnvelope,
  TelemetryFeedEnvelope,
  TelemetryOverviewEnvelope,
  TelemetryTickerEnvelope,
  TraceEnvelope
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

class HttpError extends Error {
  status: number;
  payload?: ApiFailure;

  constructor(status: number, message: string, payload?: ApiFailure) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  const raw = await response.text();
  let json: (ApiSuccess<T> | ApiFailure | { detail?: unknown }) | null = null;
  try {
    json = raw ? (JSON.parse(raw) as ApiSuccess<T> | ApiFailure | { detail?: unknown }) : null;
  } catch {
    json = null;
  }
  if (!response.ok || (json && "error" in json)) {
    const detailMessage =
      json && typeof json === "object" && "detail" in json && typeof json.detail === "string" ? json.detail : undefined;
    const apiFailure = json && typeof json === "object" && "error" in json ? (json as ApiFailure) : undefined;
    const msg = apiFailure?.error?.message ?? detailMessage ?? `HTTP ${response.status}`;
    throw new HttpError(response.status, msg, apiFailure);
  }
  return json as ApiSuccess<T>;
}

export const api = {
  gate: {
    stats: () => request<GateStatsEnvelope>("/api/gate/stats"),
    health: () => request<HealthEnvelope>("/api/gate/health")
  },
  missions: {
    recon: () => request<MissionSummary>("/api/missions/recon", { method: "POST" }),
    consult: () => request<MissionSummary>("/api/missions/consult", { method: "POST" }),
    raven: () => request<MissionSummary>("/api/missions/raven", { method: "POST" }),
    fellowship: () => request<MissionBatchResponse>("/api/missions/fellowship", { method: "POST" }),
    get: (id: string) => request<MissionSummary & Record<string, unknown>>(`/api/missions/${id}`),
    list: () => request<MissionListEnvelope>("/api/missions"),
    traces: (limit = 12) => request<MissionTracesEnvelope>(`/api/missions/traces?limit=${limit}`)
  },
  library: {
    region: (name: string) => request<RegionEnvelope>(`/api/library/region/${name}`),
    knock: () => request<GateKnockEnvelope>("/api/library/gate/knock", { method: "POST" }),
    feat: (name: string, points = 10) =>
      request<{ hero: string; new_score: number }>(`/api/library/heroes/${name}/feat`, {
        method: "POST",
        body: JSON.stringify({ points })
      }),
    sql: (query: string) =>
      request<SqlQueryResultEnvelope>("/api/library/sql", {
        method: "POST",
        body: JSON.stringify({ query })
      }),
    leaderboard: () => request<LeaderboardEnvelope>("/api/library/heroes/leaderboard"),
    stats: () => request<Record<string, unknown>>("/api/library/stats")
  },
  architecture: {
    diagram: () => request<DiagramEnvelope>("/api/architecture/diagram"),
    trace: () => request<TraceEnvelope>("/api/architecture/trace")
  },
  telemetry: {
    overview: () => request<TelemetryOverviewEnvelope>("/api/telemetry/overview"),
    feed: (limit = 50) => request<TelemetryFeedEnvelope>(`/api/telemetry/feed?limit=${limit}`),
    ticker: () => request<TelemetryTickerEnvelope>("/api/telemetry/ticker")
  }
};

export { HttpError };
