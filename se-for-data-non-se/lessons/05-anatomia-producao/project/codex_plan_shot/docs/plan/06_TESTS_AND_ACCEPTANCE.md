# Tests and Acceptance Plan

## Summary

This document expands the verification list from `../PLAN.md` into concrete test scenarios, edge cases, and acceptance gates for the Palantir implementation.

This is a planning spec, not a test implementation.

## Test Levels

- Unit tests (backend logic / utility functions)
- API integration tests (FastAPI routes and status codes)
- Frontend component/page behavior tests (optional by team capacity)
- End-to-end manual runbook (required)
- Visual/manual QA for responsive and animation behavior (required)

## Environment Baseline for Validation

- `docker compose up --build` for full stack validation
- Browser at frontend route (`localhost:5173` in dev or proxied route depending on implementation)
- Access to browser devtools console/network

## Backend API Test Scenarios

### Missions

1. `POST /api/missions/recon` returns `202` and `PENDING`.
2. `POST /api/missions/consult` returns `202` and mission id.
3. `POST /api/missions/raven` returns `202` and mission id.
4. `POST /api/missions/fellowship` returns `202` with multiple mission ids.
5. `GET /api/missions/{id}` transitions over time to terminal state.
6. `GET /api/missions/{id}` returns `404` for unknown id.
7. `GET /api/missions` returns recent mission list with expected fields.
8. At least one mission path can emit retry behavior (deterministic or probabilistic with test hook).

### Library / Redis

1. `GET /api/library/region/mordor` first request indicates cache miss (or `cached: false`) and higher latency.
2. Repeated request for same region indicates cache hit (`cached: true`) and TTL.
3. Unknown region returns `404`.
4. `POST /api/library/gate/knock` returns allowed response before limit.
5. Excess knocks return `429` with reset details and headers.
6. After reset window, knocks are allowed again.
7. `POST /api/library/heroes/{name}/feat` increments score for valid hero.
8. Invalid hero returns `404`.
9. Invalid points payload returns `400`.
10. `GET /api/library/heroes/leaderboard` returns ordered top-10.
11. `GET /api/library/stats` returns Redis connectivity and basic stats fields.

### Gate / Health

1. `GET /api/gate/workers` returns worker PID data.
2. `GET /api/gate/stats` returns queue depth and gateway metrics.
3. `GET /api/gate/health` returns service list and overall status.
4. Health endpoint degrades gracefully when a dependency is down (expected shape preserved).

### Architecture

1. `GET /api/architecture/diagram` returns nodes and edges with valid ids.
2. `GET /api/architecture/trace` returns trace id, total latency, ordered steps.
3. Trace response includes worker PID when routed through Gunicorn endpoint path.
4. Trace endpoint returns safe error or degraded trace when dependency unavailable (behavior documented and consistent).

## Frontend Page Acceptance Scenarios

## 1. Welcome (`/`)

1. Hero page loads with background and orb image.
2. Title/subtitle are readable during/after animation.
3. Four CTAs navigate to the intended routes.
4. Mini-metrics render (live or fallback values).
5. Page is usable on mobile without clipped CTA layout.

## 2. Dashboard (`/dashboard`)

1. Map panel renders with background and service nodes.
2. Location images load for mapped services.
3. Polling updates metrics approximately every 2s.
4. Health row displays text/icon + color status (not color only).
5. Transient API failure shows non-destructive error state (previous data remains visible).
6. Mobile layout stacks map and metrics cleanly.

## 3. Missions (`/missoes`)

1. Single mission launch works for each mission type.
2. Batch launch enqueues multiple missions and UI renders all cards.
3. Mission status cards progress through states with visible progress UI.
4. Retry state renders when simulated failure occurs.
5. Terminal `SUCCESS` and `FAILURE` states are visually distinct and readable.
6. History list shows recent missions after refresh.
7. Background and eagle asset usage matches matrix.

## 4. Library (`/biblioteca`)

### Cache Demo

1. All 5 region cards are visible and use the correct images.
2. First lookup is visibly slower / marked miss.
3. Second lookup is visibly cached and shows TTL countdown.
4. TTL countdown updates and expiration resets hit/miss behavior.

### Rate Limit Demo

1. Allowed knocks decrement remaining counter.
2. Blocked state appears on limit exceeded.
3. Reset countdown is shown and recovers to allowed state.

### Leaderboard Demo

1. All 10 hero avatars are wired and render in leaderboard/seed interactions.
2. Score updates reorder list correctly.
3. Tie ordering remains stable (no random flicker between polls).
4. Error state is visible and recoverable.

## 5. Architecture (`/arquitetura`)

1. Diagram renders nodes/edges from API data.
2. Node icons include broker/db/worker/location imagery per matrix.
3. Trace button triggers real request trace.
4. Path highlight and timeline update together.
5. Step latencies and notes are visible and understandable.
6. Diagram and trace remain usable on mobile (stacked layout or simplified labels).

## Cross-Cutting UX and Accessibility Checks

1. Keyboard navigation reaches nav, CTAs, and main controls on every page.
2. Focus indicators are visible on interactive elements.
3. Reduced-motion mode disables or tones down major continuous animations.
4. Color contrast remains acceptable on dark backgrounds.
5. No page depends on hover-only interaction for essential information on touch devices.

## Error/Failure/Degraded State Scenarios (Must Be Designed)

1. Redis unavailable:
   - Library page shows degraded state, not blank crash
   - Dashboard health reflects degradation
2. Celery worker unavailable:
   - Mission enqueue may fail or stay pending; UI explains status
3. Postgres unavailable:
   - Mission history may degrade while enqueue/status still works (if designed)
4. Nginx rate limit triggers:
   - UI distinguishes intentional demo block from generic server error
5. Trace endpoint timeout:
   - Architecture page shows timeout message and allows retry

## Asset Coverage Acceptance

Before implementation is considered complete:

1. Validate all `30/30` assets from `03_ASSET_COVERAGE_MATRIX.md` are present in UI usage.
2. Confirm no mapped asset is left unused.
3. Confirm each required asset has a defined fallback path in code.

## Manual Demo Script (Instructor Runbook)

Recommended flow for lesson delivery:

1. Open `/` and explain the metaphor + service count.
2. Go to `/dashboard` and show polling, health, and map nodes.
3. Go to `/missoes`, launch a single mission, then batch mission, explain workers/queue.
4. Go to `/biblioteca`, show cache miss/hit, rate limiting, leaderboard updates.
5. Go to `/arquitetura`, run request trace and narrate each step.
6. Scale workers (`docker compose up --scale worker=4`) and revisit dashboard/missions.

## Final Acceptance Gates

Implementation is "ready" only when all are true:

- Core endpoints return documented shapes/status codes
- All 5 pages are functional and navigable
- All 30 assets are used as mapped
- Degraded/error states are handled on each interactive page
- Reduced-motion and mobile usability checks pass
- No blocking console/runtime errors during the demo flow
