# API Contracts and Frontend Types (Planning Spec)

## Summary

This document turns the endpoint list from `../PLAN.md` into an implementation-ready contract for FastAPI and the React frontend.

Goals:

- Stable shapes for frontend rendering
- Predictable error handling
- Polling-friendly metadata
- Clear DTO ownership by endpoint family

## Global API Conventions (Locked)

### Base Path

- All API endpoints are under `/api`

### Response Envelope

Use a consistent envelope for JSON responses:

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-02-22T13:00:00Z"
  }
}
```

Error responses:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Gate is closed. Try again in 42 seconds.",
    "details": {
      "remaining": 0,
      "reset_in_seconds": 42
    }
  },
  "meta": {
    "timestamp": "2026-02-22T13:00:00Z"
  }
}
```

### Headers / Metadata

- `Content-Type: application/json` for all JSON routes
- Rate-limit route should return:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

### Time Format

- ISO-8601 UTC timestamps (`...Z`)

## Shared DTOs (Backend + Frontend)

### Status Enums

```ts
export type ServiceStatus = "up" | "degraded" | "down";
export type MissionStatus =
  | "PENDING"
  | "STARTED"
  | "PROCESSING"
  | "RETRY"
  | "SUCCESS"
  | "FAILURE";
```

### Core Types (TypeScript)

```ts
export interface ApiMeta {
  timestamp: string;
  request_id?: string;
  source?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  error: ApiError;
  meta: ApiMeta;
}

export interface ServiceHealthItem {
  service: "nginx" | "api" | "redis" | "celery" | "postgres" | "frontend";
  status: ServiceStatus;
  latency_ms?: number;
  detail?: string;
}

export interface WorkerInfo {
  worker_pid: number;
  parent_pid?: number;
  active_requests?: number;
  last_seen_at?: string;
}

export interface GatewayStats {
  requests_per_second: number;
  cache_hit_rate_pct: number;
  active_workers: number;
  queue_depth: number;
  nginx_rate_limit_per_second: number;
}

export interface MissionSummary {
  id: string;
  mission_type: "recon" | "consult" | "raven";
  status: MissionStatus;
  created_at: string;
  updated_at: string;
}

export interface MissionStatusDetail extends MissionSummary {
  progress_pct: number;
  current_step: string;
  steps: Array<{
    key: string;
    label: string;
    state: "pending" | "active" | "done" | "error";
  }>;
  retries_attempted: number;
  max_retries: number;
  worker_name?: string;
  worker_pid?: number;
  result?: {
    message: string;
    duration_ms?: number;
    trace_hint?: string;
  };
  failure?: {
    code: string;
    message: string;
    retrying: boolean;
  };
}

export interface MissionBatchLaunchResponse {
  batch_id: string;
  launched: MissionSummary[];
}

export interface RegionKnowledgeResponse {
  region: string;
  title: string;
  description: string;
  image_key: string;
  cached: boolean;
  ttl_seconds_remaining?: number;
  source_latency_ms: number;
}

export interface RateLimitKnockResponse {
  allowed: boolean;
  message: string;
  remaining: number;
  limit: number;
  reset_in_seconds: number;
}

export interface HeroLeaderboardEntry {
  rank: number;
  hero: string;
  display_name: string;
  score: number;
  avatar_key: string;
  delta?: number;
}

export interface LibraryStats {
  redis_connected: boolean;
  keys_estimate?: number;
  memory_used_human?: string;
  cache_hit_rate_pct?: number;
}

export interface GateStatsResponse {
  workers: WorkerInfo[];
  queue_depth: number;
  active_tasks: number;
  gateway: GatewayStats;
}

export interface ArchitectureDiagramNode {
  id: string;
  label: string;
  type:
    | "client"
    | "nginx"
    | "gunicorn"
    | "fastapi"
    | "redis"
    | "postgres"
    | "broker"
    | "worker";
  x: number;
  y: number;
  image_key?: string;
  status?: ServiceStatus;
}

export interface ArchitectureDiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
}

export interface ArchitectureTraceStep {
  order: number;
  step: string;
  service: string;
  latency_ms: number;
  cache_event?: "hit" | "miss";
  worker_pid?: number;
  notes?: string;
}

export interface ArchitectureTraceResponse {
  trace_id: string;
  total_latency_ms: number;
  steps: ArchitectureTraceStep[];
}
```

## Missions Endpoints

### `POST /api/missions/recon`
### `POST /api/missions/consult`
### `POST /api/missions/raven`

Purpose:

- enqueue one mission task of a specific type

Request body:

- empty body for MVP (type is implied by path)
- optional future extension: `{ "hero": "aragorn" }`

Response (`202 Accepted`):

```json
{
  "data": {
    "id": "mission_123",
    "mission_type": "recon",
    "status": "PENDING",
    "created_at": "2026-02-22T13:00:00Z",
    "updated_at": "2026-02-22T13:00:00Z"
  },
  "meta": { "timestamp": "2026-02-22T13:00:00Z" }
}
```

Errors:

- `503` queue unavailable
- `500` enqueue failure

### `POST /api/missions/fellowship`

Purpose:

- enqueue a batch of missions (5+ mixed tasks)

Response (`202 Accepted`):

`ApiSuccess<MissionBatchLaunchResponse>`

### `GET /api/missions/{id}`

Purpose:

- poll mission status/progress

Response (`200 OK`):

`ApiSuccess<MissionStatusDetail>`

Errors:

- `404` mission not found

### `GET /api/missions`

Purpose:

- list recent missions for history/tracker hydration

Query params:

- `limit` (default `20`, max `100`)
- `status` (optional filter)

Response:

```ts
ApiSuccess<{
  missions: MissionSummary[];
}>
```

## Library Endpoints

### `GET /api/library/region/{name}`

Purpose:

- region knowledge lookup with cache-aside behavior

Path param:

- `name` in canonical set: `mordor|rohan|gondor|shire|rivendell`

Response:

`ApiSuccess<RegionKnowledgeResponse>`

Errors:

- `404` region unknown

### `POST /api/library/gate/knock`

Purpose:

- rate-limited endpoint for UI demo

Response (`200 OK` when allowed):

`ApiSuccess<RateLimitKnockResponse>` with `allowed: true`

Error (`429 Too Many Requests` when blocked):

`ApiFailure` with `RATE_LIMITED` and reset details

### `POST /api/library/heroes/{name}/feat`

Purpose:

- add points/feat to a hero for leaderboard demo

Path param:

- `name` must match one of the 10 seeded heroes

Request body (MVP):

```json
{
  "points": 10,
  "reason": "orc_patrol_cleared"
}
```

Response:

```ts
ApiSuccess<{
  hero: string;
  new_score: number;
}>
```

Errors:

- `400` invalid points
- `404` unknown hero

### `GET /api/library/heroes/leaderboard`

Purpose:

- fetch top hero ranking

Query params:

- `limit` default `10`, max `10` in MVP

Response:

```ts
ApiSuccess<{
  entries: HeroLeaderboardEntry[];
}>
```

### `GET /api/library/stats`

Purpose:

- expose Redis stats used by Library page

Response:

`ApiSuccess<LibraryStats>`

## Gate / Operational Endpoints

### `GET /api/gate/workers`

Purpose:

- expose Gunicorn worker process data

Response:

```ts
ApiSuccess<{
  workers: WorkerInfo[];
}>
```

### `GET /api/gate/stats`

Purpose:

- provide operational metrics for dashboard (workers + queue + gateway)

Response:

`ApiSuccess<GateStatsResponse>`

### `GET /api/gate/health`

Purpose:

- aggregate health for frontend semaphores

Response:

```ts
ApiSuccess<{
  services: ServiceHealthItem[];
  overall_status: ServiceStatus;
}>
```

## Architecture Endpoints

### `GET /api/architecture/diagram`

Purpose:

- provide diagram nodes/edges and labels for frontend rendering

Response:

```ts
ApiSuccess<{
  nodes: ArchitectureDiagramNode[];
  edges: ArchitectureDiagramEdge[];
}>
```

### `GET /api/architecture/trace`

Purpose:

- run and return a traceable request path with step latencies

Response:

`ApiSuccess<ArchitectureTraceResponse>`

Errors:

- `503` dependency unavailable (trace partially possible if designed so; document behavior)

## Frontend State Helper Types (Planned)

```ts
export interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdatedAt: string | null;
}

export interface AsyncActionState<T> {
  status: "idle" | "submitting" | "success" | "error";
  data?: T;
  error?: ApiError;
}

export interface AssetSpec {
  key: string;
  path: string;
  alt: string;
  decorative: boolean;
  priority: "hero" | "high" | "default" | "lazy";
  usage: string[];
}
```

## Contract Testing Recommendations (Planning)

- Backend unit tests for DTO shape and enum constraints
- API tests for status codes (`200/202/404/429/503`)
- Frontend runtime validation or strict typing to prevent undefined property rendering
- Snapshot tests only for static schema transforms (not animation output)
