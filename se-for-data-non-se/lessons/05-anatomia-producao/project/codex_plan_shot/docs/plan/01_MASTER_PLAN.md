# Master Plan - Palantir (Module 05 Integrated Production Anatomy Project)

## Summary

Palantir is a LOTR-themed teaching app that demonstrates a production-like stack end to end:

- `Nginx` as reverse proxy and rate limiting gateway
- `Gunicorn + UvicornWorker` running a `FastAPI` API
- `Redis` for cache, rate limiting state, leaderboard, and Celery broker
- `PostgreSQL` for durable mission history and aggregate data
- `Celery` workers for async missions
- `React + Vite + Tailwind + Framer Motion` frontend for visualization and guided interaction

The project is intentionally didactic: each page maps technical concepts to a Middle-earth metaphor and exposes real behavior through interactive UI (polling, queue progress, cache hit/miss, request tracing).

## Goals and Success Criteria

### Learning Goals

- Show how production layers connect, not just isolated examples
- Make infrastructure behavior visible to learners through UI feedback
- Reuse patterns from prior modules while introducing production concerns

### Product Success Criteria

- All core services run together via Docker Compose
- Frontend demonstrates all target concepts through real API interactions
- Every planned image asset is used in a defined UI context
- UI remains usable on desktop and mobile
- Validation scenarios in `06_TESTS_AND_ACCEPTANCE.md` pass

## Concept Mapping (Technical -> LOTR)

| Technical Layer | Palantir Metaphor | Teaching Message |
|---|---|---|
| Nginx | Great Gate of Minas Tirith | Every request enters through a guarded gateway |
| Gunicorn workers | The Citadel guards | Multiple workers handle requests in parallel |
| FastAPI | White Council | App orchestration and API contracts |
| Redis | Rivendell Library | Fast in-memory knowledge and shared signals |
| PostgreSQL | Stone halls of Minas Tirith | Durable records and historical truth |
| Celery queue/workers | Beacons + Eagles | Async dispatch and background execution |
| Full diagram | Map of Middle-earth | End-to-end system visibility |

## Stack (Locked)

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Python 3.12, uv, FastAPI, Pydantic v2 |
| App Server | Gunicorn + UvicornWorker (4 workers default) |
| Reverse Proxy | Nginx (rate limiting + proxy) |
| Cache/Broker | Redis 7 |
| DB | PostgreSQL 16 |
| Queue | Celery |
| Orchestration | Docker Compose |

## Runtime Topology (Target)

Flow:

`Browser (5173 during dev or frontend container) -> Nginx :80 -> Gunicorn/FastAPI :8000 -> Redis / PostgreSQL / Celery workers`

Compose services (target baseline):

- `nginx`
- `api`
- `db`
- `redis`
- `worker`
- `worker-2`
- `frontend`

## Repository-Level Target Structure (Implementation Target, not created here)

```text
project/
  docker-compose.yml
  nginx/nginx.conf
  db/init.sql
  api/
    Dockerfile
    pyproject.toml
    src/
      main.py
      config.py
      database.py
      models.py
      tasks.py
      routes/
        missions.py
        library.py
        gate.py
        architecture.py
  frontend/
    Dockerfile
    package.json
    vite.config.ts
    tailwind.config.ts
    postcss.config.js
    public/images/{ui,locations,heroes,regions}
    src/
      App.tsx
      main.tsx
      index.css
      components/
      pages/
```

## Frontend Product Structure (Locked)

### Navigation Model

- `/` = landing hero page, no sidebar
- Internal pages use a sticky top nav (`MainShell`)
- Internal routes:
  - `/dashboard`
  - `/missoes`
  - `/biblioteca`
  - `/arquitetura`

### Page 0 - Welcome (`/`)

Purpose:

- Introduce theme and project purpose
- Provide fast route entry points
- Show quick operational metrics snapshot

Required UI blocks:

- Full-screen themed hero background
- Palantir orb visual centerpiece
- Title/subtitle with animated text treatment
- 4 CTAs to internal pages
- Mini-metrics row (services, workers, cache %, queue/tasks)
- Subtle command hint/footer text

### Page 1 - Dashboard (`/dashboard`)

Purpose:

- Visualize live service topology and health
- Show polling-based production metrics

Required UI blocks:

- Middle-earth inspired interactive map panel
- Service nodes (Nginx/Gunicorn/Redis/Celery plus optional DB/Broker indicators)
- Live metrics panel (polling every 2s)
- Service health semaphores
- Hover tooltips with service details

### Page 2 - Missions (`/missoes`)

Purpose:

- Demonstrate async processing with Celery
- Show progress, retries, and worker behavior

Required UI blocks:

- Mission launcher cards (recon, consult, raven)
- Batch launch action ("Convocar a Sociedade")
- Mission tracker list/cards with status transitions
- Progress stepper and progress percent
- Recent mission history list
- Worker/load hints (and scaling instructions)

### Page 3 - Library (`/biblioteca`)

Purpose:

- Teach Redis patterns through interactions

Required sections:

- Cache-aside region knowledge lookup with TTL countdown
- Rate limit "gate knock" demo with remaining/reset indicators
- Hero leaderboard using sorted sets (top 10)
- Redis stats summary panel (optional but recommended)

### Page 4 - Architecture (`/arquitetura`)

Purpose:

- Explain end-to-end request path and service interplay

Required UI blocks:

- Interactive flow diagram (nodes + edges)
- Request trace action triggering real API path
- Step-by-step latencies per layer
- Cache hit/miss annotation if applicable
- Port reminders and links back to prior module concepts

## Frontend Architecture and UX Standards

The base plan already defines the page content. Frontend layout/navigation should follow the `cozinhas-chat-pt` / Le Philot pattern already referenced in module-05 materials, while this plan adds selective internal UI artifact ideas from the SOLID frontend (frontend only):

- Reusable animated primitives instead of page-specific animation code everywhere
- Clear `layout/`, `shared/`, feature-specific component grouping
- Motion as educational feedback, not decoration-only
- Lightweight local/global state split (page state local; shared progress/session state contextual)
- Ambient layered background effects with controlled intensity

See `02_FRONTEND_REFERENCE_SYNTHESIS.md` for the exact adopt/adapt/reject matrix.

## Backend Functional Scope (Locked)

### Missions (Celery)

- Enqueue three mission types with different durations
- Batch enqueue endpoint
- Per-mission status retrieval
- Recent mission history
- Progress and retry simulation for didactic behavior

### Library (Redis)

- Cache-aside for region knowledge lookups
- Rate limiting endpoint with counters and reset timing
- Leaderboard score updates and ranking retrieval
- Basic Redis stats endpoint for UI display

### Gate / Operational Stats

- Gunicorn worker PID visibility
- Queue depth / Celery stats
- Combined service health endpoint

### Architecture

- Diagram metadata endpoint (nodes/edges/labels)
- Request trace endpoint with step latencies and path annotations

## Data and Persistence Scope

### PostgreSQL (durable)

- Mission history (id, type, status timeline summary, timestamps)
- Hero leaderboard durable snapshots or aggregate records (implementation choice documented later)
- Optional metrics snapshots (nice to have; not required for MVP)

### Redis (ephemeral/shared)

- Cache entries + TTL
- Rate limiting counters
- Leaderboard sorted set
- Celery broker state
- Optional transient metrics

## Non-Functional Requirements (Locked)

- Mobile and desktop support (responsive, readable, interactive)
- Accessible keyboard navigation for buttons/forms/nav
- `prefers-reduced-motion` support for major animations
- Polling must not cause layout shift/jank
- Empty, loading, error, and degraded states must be designed (not placeholders)

## Phased Build Strategy (High Level)

1. Foundation and infrastructure wiring
2. Backend capabilities and contracts
3. Frontend landing + dashboard
4. Frontend missions
5. Frontend library
6. Frontend architecture
7. Polish, docs, end-to-end validation

Detailed breakdown and dependencies are in `05_IMPLEMENTATION_PHASES_AND_TASKS.md`.

## Public API Surface (Summary)

Endpoint families:

- `/api/missions/*`
- `/api/library/*`
- `/api/gate/*`
- `/api/architecture/*`

Detailed request/response contracts and TS DTOs are defined in `04_API_CONTRACTS_AND_TYPES.md`.

## Asset Coverage Requirement (Hard Rule)

All image assets listed in `../PROMPT_ASSETS.md` must have a required usage in the final implementation plan. No asset is optional by omission.

Source of truth:

- `03_ASSET_COVERAGE_MATRIX.md`

## Validation and Acceptance

The original `PLAN.md` verification list is expanded into:

- page-level checks
- API contract checks
- degraded/error behavior checks
- demo flow checks

See `06_TESTS_AND_ACCEPTANCE.md`.

## References and Reuse Strategy

Primary references:

- Module 05 practices and project references (`../REFERENCES.md`)
- Module 05 visual and asset prompts (`../FRONTEND_SAMPLES.md`, `../PROMPT_ASSETS.md`)

Selective internal UI artifact reference (frontend only):

- Module 03 SOLID project frontend (`.../03-OPP/solid_project/solid-refactory`)

Rationale and exact selective reuse decisions are documented in `02_FRONTEND_REFERENCE_SYNTHESIS.md` and `07_DECISIONS_AND_ASSUMPTIONS.md`.
