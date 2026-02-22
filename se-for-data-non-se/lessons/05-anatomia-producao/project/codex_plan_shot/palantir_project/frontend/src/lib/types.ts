export interface ApiMeta {
  timestamp: string;
  source?: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  error: {
    code?: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: ApiMeta;
}

export interface GateStatsEnvelope {
  workers: Array<{ worker_pid: number; parent_pid?: number }>;
  queue_depth: number;
  active_tasks: number;
  gateway: {
    requests_per_second: number;
    cache_hit_rate_pct: number;
    active_workers: number;
    queue_depth: number;
    nginx_rate_limit_per_second: number;
  };
}

export interface HealthEnvelope {
  services: Array<{ service: string; status: "up" | "degraded" | "down" }>;
  overall_status: "up" | "degraded" | "down";
}

export interface MissionSummary {
  id: string;
  mission_type: "recon" | "consult" | "raven";
  status: string;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface MissionBatchResponse {
  batch_id: string;
  launched: MissionSummary[];
}

export interface MissionListEnvelope {
  missions: MissionSummary[];
}

export interface MissionTraceStep {
  order: number;
  service: string;
  stage: string;
  port?: string | null;
  label: string;
  created_at: string;
  status?: string;
  payload?: TelemetryEvent["payload"] | null;
}

export interface MissionTraceRecord {
  mission_id: string;
  mission_type?: string;
  hero_key?: string;
  hero_display_name?: string;
  status: string;
  started_at?: string | null;
  ended_at?: string | null;
  steps: MissionTraceStep[];
}

export interface MissionTracesEnvelope {
  traces: MissionTraceRecord[];
}

export interface LeaderboardEntry {
  rank: number;
  hero: string;
  display_name: string;
  score: number;
  avatar_key: string;
}

export interface LeaderboardEnvelope {
  entries: LeaderboardEntry[];
}

export interface RegionEnvelope {
  region: string;
  title: string;
  description: string;
  image_key: string;
  cached: boolean;
  ttl_seconds_remaining?: number;
  source_latency_ms: number;
}

export interface GateKnockEnvelope {
  allowed: boolean;
  message: string;
  remaining: number;
  limit: number;
  reset_in_seconds: number;
}

export interface SqlQueryResultEnvelope {
  columns: string[];
  rows: Array<Array<unknown>>;
  row_count: number;
  truncated?: boolean;
}

export interface DiagramEnvelope {
  nodes: Array<{
    id: string;
    label: string;
    sublabel?: string;
    type: string;
    role?: string;
    x?: number;
    y?: number;
    x_pct?: number;
    y_pct?: number;
    width_pct?: number;
    image_key?: string;
    accent_image_key?: string;
    tone?: "gold" | "blue" | "green" | "amber" | "red";
    port?: string | null;
    render_mode?: "image" | "emblem";
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    animated?: boolean;
    kind?: "sync" | "async";
    tone?: "gold" | "blue" | "green" | "amber" | "red";
    path?: Array<[number, number]>;
  }>;
}

export interface TraceEnvelope {
  trace_id: string;
  total_latency_ms: number;
  steps: Array<{
    order: number;
    step: string;
    phase_label?: string;
    service: string;
    node_id?: string;
    edge_ids?: string[];
    latency_ms: number;
    port?: string;
    tone?: "gold" | "blue" | "green" | "amber" | "red";
    cache_event?: string;
    worker_pid?: number;
    details?: Record<string, unknown>;
  }>;
}

export interface TelemetryEvent {
  id: string;
  kind: string;
  stage: string;
  service: string;
  status: "info" | "success" | "warn" | "error";
  label: string;
  entity_id?: string | null;
  latency_ms?: number | null;
  payload?: {
    mission_id?: string;
    source_mission_id?: string;
    mission_type?: string;
    hero_key?: string;
    hero_display_name?: string;
    hero_avatar_key?: string;
    artifact_key?: string;
    phase_ui?: string;
    progress_pct?: number;
    points_awarded?: number;
    new_score?: number;
    status?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface TelemetryServiceStatus {
  service: string;
  status: "up" | "degraded" | "down";
  last_seen_at?: string;
  rps?: number;
  inflight?: number;
  ops_per_sec?: number;
  writes_per_min?: number;
  active_tasks?: number;
}

export interface TelemetryOverviewEnvelope {
  services: TelemetryServiceStatus[];
  metrics: {
    requests_per_second: number;
    cache_hit_rate_pct: number;
    active_workers: number;
    queue_depth: number;
    nginx_rate_limit_per_second: number;
  };
  health: {
    overall_status: "up" | "degraded" | "down";
  };
  counts_60s: {
    requests: number;
    mission_events: number;
    library_events: number;
    redis_hits: number;
    redis_misses: number;
    postgres_writes: number;
    rate_limited: number;
  };
  backend: {
    redis: boolean;
    postgres: boolean;
  };
}

export interface TelemetryFeedEnvelope {
  events: TelemetryEvent[];
}

export interface TelemetryTickerEnvelope {
  counts_60s: TelemetryOverviewEnvelope["counts_60s"];
  last_event_at: string | null;
}
