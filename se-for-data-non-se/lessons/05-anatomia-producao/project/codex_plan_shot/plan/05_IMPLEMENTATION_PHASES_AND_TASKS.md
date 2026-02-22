# Implementation Phases and Tasks (Decision-Complete Execution Plan)

## Summary

This is the execution breakdown for implementing the Palantir project using the consolidated plan pack.

Design principles:

- Minimal vertical slices early
- Backend/frontend contracts stabilized before UI complexity
- Parallel work where dependencies allow
- Acceptance gates at each phase

## Roles (Optional Multi-Agent Split)

- `team-lead`: coordinates, integrates, reviews, runs end-to-end checks
- `backend-dev`: API, Redis, Celery, Gunicorn, Postgres, Nginx integration
- `frontend-dev`: React UI, routing, components, animations, polling, asset integration

## Phase 0 - Preparation (Planning to Execution Handoff)

### Tasks

1. Read all docs in this plan pack.
2. Confirm implementation scope and delivery target (MVP vs full polish).
3. Lock route names and API envelopes from `04_API_CONTRACTS_AND_TYPES.md`.
4. Confirm asset files exist/generated for all entries in `03_ASSET_COVERAGE_MATRIX.md`.

### Deliverables

- Shared understanding of contracts and page scope

### Exit Criteria

- No unresolved contract-level decisions remain

## Phase 1 - Foundation and Infrastructure

### Goals

- Bring up a runnable multi-service skeleton
- Wire reverse proxy and app server basics
- Scaffold frontend routing/layout shell

### Backend/Infra Tasks

1. Create project folders (`api`, `frontend`, `nginx`, `db`) and baseline files.
2. Compose all 7 services with ports, volumes, dependencies, env vars.
3. Add Nginx config (proxy + rate limiting + health endpoint).
4. Create FastAPI app entrypoint with basic routers and health route.
5. Run Gunicorn with `UvicornWorker` (4 workers default).
6. Add Redis and Postgres connection config placeholders.
7. Add Celery app config placeholder (broker/backend wiring).

### Frontend Tasks

1. Scaffold Vite React TS app with Tailwind + Framer Motion + Lucide.
2. Set up router and page routes.
3. Implement `MainShell` top nav (desktop/mobile baseline).
4. Add `Welcome` page shell and internal page placeholders.
5. Create theme tokens in `index.css` and shared base styles.

### Parallelization

- Backend/Infra and Frontend can run in parallel after route/API naming is locked.

### Exit Criteria

- `docker compose up --build` starts containers (features may be stubbed)
- Frontend routes render without runtime errors
- API proxy path can be exercised end-to-end through Nginx

## Phase 2 - Backend Core Features and Contracts

### Goals

- Implement API behavior for all page features
- Match response contracts from `04_API_CONTRACTS_AND_TYPES.md`

### Missions (Celery) Tasks

1. Define mission model/schema and persistence strategy.
2. Implement Celery tasks for `recon`, `consult`, `raven`.
3. Add progress updates and retry behavior (didactic failures).
4. Implement enqueue endpoints and batch endpoint.
5. Implement mission status polling endpoint and recent list endpoint.
6. Persist/restore mission summaries for history UI.

### Library (Redis) Tasks

1. Seed region knowledge records and hero leaderboard baseline.
2. Implement cache-aside region lookup with measurable miss delay.
3. Implement rate limit "gate knock" endpoint + headers.
4. Implement leaderboard feat update + top-10 retrieval.
5. Implement Redis stats endpoint.

### Gate / Health / Metrics Tasks

1. Worker PID info endpoint (Gunicorn process visibility).
2. Queue stats endpoint (depth, active tasks).
3. Aggregated health endpoint for services.
4. Gateway stats aggregation endpoint or combine into gate stats.

### Architecture Tasks

1. Static/derived diagram node+edge endpoint.
2. Trace endpoint that executes a request path and records step latencies.
3. Include cache hit/miss and worker PID annotations where available.

### Backend Exit Criteria

- All documented endpoints return correct envelopes and status codes
- Manual curl tests cover `200/202/404/429`
- Frontend can be developed against stable contracts

## Phase 3 - Frontend Foundation + Shared Components

### Goals

- Build reusable UI primitives and typed API client before page-specific complexity

### Tasks

1. Implement typed `lib/api.ts` clients by domain.
2. Implement shared DTO types aligned with `04_API_CONTRACTS_AND_TYPES.md`.
3. Implement `lib/assets.ts` registry from `03_ASSET_COVERAGE_MATRIX.md`.
4. Build shared components:
   - `GlowCard`
   - `StatusBadge`
   - `AnimatedCounter`
   - `SectionHeader`
   - `TexturePanel`
   - loading/error/empty states
5. Build polling hooks (`usePollingResource`) with abort + stale data retention.
6. Add reduced motion utility hook and motion token definitions.
7. Implement page backdrops and image rendering helpers.

### Exit Criteria

- Shared primitives render correctly and are keyboard/focus accessible
- Polling hook handles success + transient error + route changes
- Asset registry covers all 30 assets

## Phase 4 - Frontend Welcome + Dashboard

### Welcome Page Tasks

1. Build full-screen hero with `welcome-bg.png` and overlay.
2. Add central `palantir-orb.png` with controlled glow animation.
3. Implement animated title/subtitle (Palantir-themed, readable).
4. Add four CTAs to internal pages.
5. Add mini-metrics row (stubbed or live depending on backend readiness).
6. Add footer command hint / subtle helper text.

### Dashboard Tasks

1. Build `MiddleEarthMap` with `map-bg.png`.
2. Implement service nodes using location images.
3. Fetch/poll `/api/gate/stats` and `/api/gate/health`.
4. Render metrics panel and service health row.
5. Add hover/tap details and degraded-state handling.

### Exit Criteria

- `/` and `/dashboard` match intended UX and respond to live/stub data
- Polling updates are smooth and non-destructive on transient failure

## Phase 5 - Frontend Missions

### Tasks

1. Build mission launcher UI with three mission cards and batch launcher.
2. Integrate mission enqueue endpoints.
3. Build mission tracker cards + status stepper + progress bars.
4. Implement polling of active mission statuses.
5. Render retry/failure/success variants and explanatory messages.
6. Add mission history list hydration from `/api/missions`.
7. Integrate `missions-bg.png` and `eagles.png` usage per matrix.

### Exit Criteria

- Launch single and batch missions from UI
- Status transitions render correctly including retry/failure paths

## Phase 6 - Frontend Library

### Cache Demo Tasks

1. Build region selector/cards using all 5 region images.
2. Integrate region lookup endpoint and cache hit/miss visual states.
3. Show TTL countdown when cached.

### Rate Limit Demo Tasks

1. Build "Bater no portao" action panel.
2. Integrate rate-limit endpoint and render remaining/reset.
3. Handle `429` with visible countdown and recovery state.

### Leaderboard Tasks

1. Seed frontend hero metadata using all 10 avatar assets.
2. Integrate feat update and leaderboard fetch endpoints.
3. Render top-10 list with stable ordering and animations.
4. Handle empty/error/degraded states gracefully.

### Exit Criteria

- All 3 Redis demos work end-to-end
- All hero and region image assets are visibly used

## Phase 7 - Frontend Architecture Page

### Tasks

1. Build `FlowDiagram` using node/edge schema from API.
2. Render all infrastructure nodes including broker/db/worker-specific icons.
3. Integrate `/api/architecture/diagram`.
4. Integrate `/api/architecture/trace` and trigger button UX.
5. Animate path highlighting and trace timeline updates.
6. Show step latency, cache event, worker PID, and explanatory notes.
7. Add "lesson bridge" callouts (ports, REST continuity).

### Exit Criteria

- Trace endpoint drives visible end-to-end animation and timeline
- Diagram remains legible on desktop and mobile

## Phase 8 - Polish, Docs, and Integration Validation

### Tasks

1. Refine motion intensity and reduced-motion behavior.
2. Tune responsive layouts and touch interactions.
3. Finalize loading/error/degraded copy for all pages.
4. Verify all 30 assets against `03_ASSET_COVERAGE_MATRIX.md`.
5. Write final project README/run instructions (outside this plan pack, during implementation).
6. Run end-to-end checks from `06_TESTS_AND_ACCEPTANCE.md`.

### Exit Criteria

- Acceptance checklist passes
- No missing asset placements
- No obvious console/runtime errors in core flows

## Dependency Graph (Critical Paths)

### Hard Dependencies

- API contract lock -> frontend typed client
- Compose + services boot -> live integration testing
- Celery tasks/status -> Missions page completion
- Redis endpoints -> Library page completion
- Trace endpoint -> Architecture page completion

### Soft Dependencies

- Final animation polish can happen after all pages function
- Advanced card effects can be deferred if performance risk appears

## Handoff Artifacts Between Roles

### Backend -> Frontend

- Endpoint URL list
- Example JSON responses per route
- Known error cases and status codes
- Seed data lists (heroes, regions)

### Frontend -> Backend

- Any schema mismatches discovered during integration
- Required fields for UX states (especially missions and trace)
- Polling load observations and desired aggregation changes

### Team Lead

- Keeps a running integration checklist
- Verifies contract drift does not occur silently
- Owns final acceptance run
