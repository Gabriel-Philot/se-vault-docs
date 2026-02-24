# Palantir (Codex Shot) - Production Anatomy Demo App

Palantir is a didactic full-stack application built for the lesson **"Anatomia de Produção"** (Production Anatomy).
It is a visual, interactive simulation of a production-like system with:

- `Nginx` as gateway/proxy
- `FastAPI` as the application API
- `Redis` for cache + runtime state + telemetry hot data
- `Postgres` for persisted records and telemetry history
- `Celery` workers (conceptual async layer + infra narrative)
- `React + Vite` frontend with multiple pages for different production concepts

This folder contains both:
- the **implemented application** (`palantir_project/`)
- the **planning/reference package** (`plan/`, `docs/`) used to design and evolve it

## What This README Covers

This README is application-focused. It explains:

- how to run the app (with exact `cd` commands starting from the `se-vault-docs` path)
- what each page does
- what backend/frontend features were implemented
- what production/software concepts the project demonstrates
- how the simulated mission flow works
- how telemetry, traces, cache, SQL explorer, and architecture replay work
- common troubleshooting and reset flows

It does **not** document each file in the `plan/` folder individually. Treat the `plan/` folder as a **project-wide reference package** for how this app was planned and iterated.

---

## 1. Project Location and Folder Structure

### Root (this README)

```text
/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot
```

### Main application folder

```text
.../codex_plan_shot/palantir_project
```

### High-level folders inside `codex_plan_shot/`

- `palantir_project/` - the runnable app (frontend, API, DB init, nginx, docker compose)
- `plan/` - planning and execution journal reference package (use as reference for the whole folder)
- `docs/` - additional implementation notes (including Celery role/current usage)

---

## 2. What the Application Demonstrates (Big Picture)

Palantir is intentionally split into pages, each page teaching a different part of a production system story:

- `Dashboard` = operational runtime story (events, live activity, mission/widget reactions)
- `Missoes` = job dispatch/execution lifecycle and trace terminal
- `Biblioteca` = cache, rate limit, leaderboard, and read-only SQL inspection of system records
- `Arquitetura` = topology diagram + request trace replay through services

Together they show a **full narrative**:

1. A request/action happens (`Missoes` / `Biblioteca`)
2. It generates telemetry/events
3. The `Dashboard` reacts visually and shows records in motion
4. `Arquitetura` explains where requests travel in the system
5. `Biblioteca` allows inspection of persisted/system data via read-only SQL

This is not a production system, but a **production anatomy simulator** with real components and carefully shaped teaching flows.

---

## 3. Stack and Runtime Architecture

## Frontend
- `React` + `Vite`
- `TypeScript`
- `TailwindCSS`
- `Framer Motion` for motion/replay/animated lists

## Backend
- `FastAPI` (main API)
- `Redis` (cache, telemetry hot state, mission runtime mirroring, dedup emit guards)
- `Postgres` (persisted tables + telemetry event history)
- `Celery` workers (async layer representation and worker runtime presence)

## Edge/Gateway
- `Nginx` proxies `/api` and can be used as the single entry point for browser + API routing path behavior

## Docker Compose Services (current stack)
Defined in `palantir_project/docker-compose.yml`:

- `nginx`
- `api`
- `worker`
- `worker-2`
- `redis`
- `db`
- `frontend`

---

## 4. How to Run the Application (Exact Commands)

## Option A (Recommended): Run the whole stack with Docker Compose

### Step 1 — go to the project folder

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project
```

### Step 2 — build and start everything

```bash
docker compose up --build -d
```

### Step 3 — confirm services are up

```bash
docker compose ps
```

### Step 4 — open the app

Frontend (direct Vite container):
- `http://localhost:5173`

Frontend/API through Nginx gateway (recommended for `/api` path behavior):
- `http://localhost:8080`

Notes:
- The frontend container is configured with `VITE_API_BASE_URL=http://localhost:8080`
- So even when you open `http://localhost:5173`, API calls are expected to go through Nginx on `:8080`

---

## 5. How to Stop / Reset

## Stop the stack (preserve DB/Redis volumes)

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project

docker compose down
```

## Full reset (wipe runtime state, DB data, Redis, containers)

This is useful when you want a clean demo state (missions/telemetry/leaderboard history reset):

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project

docker compose down --volumes --remove-orphans
docker compose up --build -d
```

Optional (deeper reset of local built images too):

```bash
docker images | grep palantir_project
# remove the palantir_project-* images if you want a full rebuild from image layers
```

---

## 6. Main Pages and What Each One Teaches

## `/` — Welcome (Palantir Landing)
Purpose:
- Visual entry point to the system
- Sets the mood and gives quick navigation to all pages

What it includes:
- cinematic hero visual (Palantir orb)
- animated title treatment (subtle modern effects)
- entry cards for the 4 internal pages
- compact status strip (services/workers/cache/queue summary)

Concepts touched:
- product framing / command center UX
- information architecture (routing into specialized operational views)
- visual hierarchy and signaling

---

## `/dashboard` — Runtime Flow / Operational View
Purpose:
- Show the **live operational story** of the system
- Visualize how actions from other tabs generate runtime effects and records

What it includes:
- large map canvas (image-first)
- 3 mini widgets inside the map (missions, library/artifacts, infra pulse)
- `Leitura Rápida` strip (compact summary)
- `Live Registros` (animated event feed)
- lower operational panels:
  - `Missões Ativas`
  - `Biblioteca / Cache`
  - `Resumo Operacional`

What it demonstrates:
- telemetry-driven UI updates
- event feed aggregation
- operational status summarization vs detailed logs
- cross-page reactivity (actions in `Missoes`/`Biblioteca` reflect here)

Important implementation behavior:
- Dashboard widgets react to telemetry payloads with domain metadata (hero/artifact/phase)
- Mission widget now supports all heroes and uses circular avatar tokens with active/inactive contrast
- `Live Registros` uses an animated-list style rendering (stagger/layout transitions)

---

## `/missoes` — Job Lifecycle / Workers / Terminal Trace
Purpose:
- Simulate job dispatch and execution
- Make queue -> worker -> persistence visible and understandable

What it includes:
- Mission launcher (`Recon`, `Consultar`, `Corvo`, batch fellowship-like launch)
- Active mission visual area (heroes/workers + progress)
- `Terminal de Execução`:
  - recent mission sessions list
  - terminal-like chain of steps/services/ports
  - grouped by mission

What it demonstrates:
- mission lifecycle states (`PENDING`, `STARTED`, `PROCESSING`, `RETRY`, `SUCCESS` + UI phases)
- async execution narrative (broker/worker/persist/score)
- telemetry-to-terminal reconstruction
- state synchronization across navigation/remounts

Important behavior implemented:
- Mission execution phase is **randomized to 4–8 seconds** (after queue, before persist/save)
- Runtime mission state is mirrored in Redis so missions continue to appear correctly across page switches and API worker changes
- Top mission cards preserve flow (active at top, completed can remain and be pushed down)
- Duplicate telemetry inflation was mitigated with frontend polling simplification + backend Redis emit-once guards

---

## `/biblioteca` — Cache + Rate Limit + Leaderboard + SQL Records Explorer
Purpose:
- Demonstrate cache behavior, rate limiting, persisted records, and system table inspection

What it includes:

### Top operations scene
- `Cache Demo`
  - choose region (Mordor, Rohan, Gondor, Shire, Rivendell)
  - see hit/miss and TTL behavior
- `Rate Limit Demo`
  - simulate knocking at the gate (allowed vs blocked / 429)
- `Leitura rápida`
  - compact summary of last region access, cache state, gate status
- top stat cards (`keys_estimate`, `cache_hit_rate_pct`, `redis`, `postgres`)

### `Leaderboard de Heróis`
- hero score cards
- rank + score + avatar
- recent mission/reward chips (derived from recent mission traces/events)
- `+Feat` button to award points manually for demo purposes

### `Explorador SQL (somente leitura)`
- preset queries + editable query panel
- read-only SQL execution against whitelisted tables
- results table view
- Postgres-themed backdrop (system records vibe)

What it demonstrates:
- cache-aside pattern (hit/miss, source read, cache write)
- rate limiting and 429 behavior
- leaderboard persistence / score updates
- read-only operational introspection using SQL
- difference between app-level APIs and direct persisted/system views

Important backend constraints for SQL explorer:
- `SELECT` only
- single statement only
- no comments
- forbidden DML/DDL keywords blocked
- table whitelist:
  - `telemetry_events`
  - `heroes`
  - `missions`

---

## `/arquitetura` — Topology + Request Trace Replay
Purpose:
- Teach the system topology and request path through the stack
- Make infrastructure and request flow visible, step-by-step

What it includes:
- large architecture canvas with service nodes and edges
- request trace replay button (`Trace a Request`)
- animated highlighting of nodes/edges as steps replay
- trace timeline/details panel below the image
- infra health chip row (moved here from Dashboard for better conceptual fit)
- nodes/edges metadata panels

What it demonstrates:
- gateway -> app server -> API handler -> cache/db -> broker -> worker path
- service roles and ports
- trace replay as a teaching tool (not just static diagram)
- topology vs runtime flow distinction (`Arquitetura` vs `Dashboard`)

Important visual refinements implemented:
- node image strips replaced by circular thumbnails (less visual clutter)
- labels moved below images (no blurred overlay over artwork)
- main ingress path alignment cleaned up (`User -> Nginx -> Gunicorn -> FastAPI`)
- architecture worker metaphor corrected to **Erebor** (forge/processing), while `Eagles` remain mission-hero metaphors in mission/dashboard contexts

---

## 7. Backend APIs (High-Level Reference)

The API is mounted by FastAPI and exposed behind Nginx under `/api/*`.

### Core route groups
- `/api/missions/*`
- `/api/library/*`
- `/api/gate/*`
- `/api/architecture/*`
- `/api/telemetry/*`

### Root endpoint
- `GET /` (FastAPI root) returns a small health/scaffold message envelope

## Response style
Most endpoints use an envelope style like:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "...",
    "source": "..."
  }
}
```

Some error cases return:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": { ... }
  },
  "meta": { ... }
}
```

---

## 8. Mission Lifecycle (Detailed Conceptual Walkthrough)

The mission system is one of the key teaching pieces.

## What happens when a mission is launched

1. User launches a mission in `/missoes`
2. Backend creates a mission runtime record with:
   - mission type
   - chosen hero (deterministic mapping/rotation by mission type)
   - artifact metaphor
   - timing parameters (queue, execution, persist, score delays)
3. Telemetry emits:
   - `mission_invoked`
   - `mission_queued`
4. Mission enters execution phase (4–8s randomized)
5. Progress emits in buckets (`mission_progress`)
6. Mission completes and emits terminal stages:
   - `mission_completed`
   - `mission_persisted`
   - `hero_scored`
   - `leaderboard_update`
7. Frontend pages react:
   - `Missoes`: active mission cards + terminal updates
   - `Dashboard`: mission widget + `Live Registros`
   - `Biblioteca`: leaderboard and recent hero activity chips

## Why the Redis runtime mirror exists

Initially, missions lived only in in-memory API worker state, which broke the UX when:
- the user changed tabs/pages
- a different API worker served the next request

Now missions are mirrored into Redis so runtime continuity is preserved across navigation and worker changes.

## Why telemetry emit-once guards exist

Mission progression updates are computed during read refreshes. Without dedup guards, polling could generate repeated telemetry events.

Redis-backed emit-once markers prevent:
- repeated progress bucket events
- repeated terminal events (`completed/persisted/scored/leaderboard_update`)
- repeated score application

This keeps the terminal traces and telemetry feed meaningful instead of exploding with duplicates.

---

## 9. Cache / Rate Limit / SQL Concepts (What the Biblioteca Teaches)

## Cache-aside demo (`/api/library/region/{name}`)
The region endpoint simulates:
- cache lookup (`redis_hit` / `redis_miss`)
- source read (simulated Postgres read latency)
- cache write
- TTL countdown

The UI shows:
- whether the result came from cache or source
- TTL remaining
- source latency

This is a clean teaching example of **cache-aside** behavior.

## Rate limit demo (`/api/library/gate/knock`)
The gate demo simulates a request limit per window:
- allowed knocks
- blocked knocks (`429`)
- reset timer
- rate-limit headers

This teaches:
- gateway throttling
- user-visible blocked states
- operational feedback loops (UI + telemetry)

## Read-only SQL explorer (`/api/library/sql`)
This is a guided, safe introspection surface.

It teaches:
- how persisted data differs from live UI state
- how telemetry and operational events can be queried historically
- safe database inspection patterns (read-only, whitelisted tables)

Example questions students can answer with presets:
- What event types are happening most?
- Which services are generating events?
- Which heroes have the highest scores?
- What mission rows exist in persisted storage?

---

## 10. Dashboard vs Architecture (Important Conceptual Split)

A core design decision in this app is the split between:

## Dashboard = Runtime Story
- what is happening now
- live telemetry feed
- mission/library operational reactions
- compact summaries and activity panels

## Architecture = Topology Truth
- what services exist
- how a request flows through them
- request trace replay
- infra health chips + node/edge mapping

This separation is intentional and pedagogically useful:
- one page explains **behavior over time** (`Dashboard`)
- another explains **structure and path** (`Arquitetura`)

---

## 11. Celery Workers: What They Are Doing Here (Current State)

The stack includes two Celery workers (`worker`, `worker-2`).

### Current role (important nuance)
They primarily serve as:
- the async worker layer in the architecture narrative
- runtime services present in Docker/infra visualization
- conceptual background processing representation for missions/telemetry

### What is still simulated in FastAPI
Some mission lifecycle progression is still route-driven (didactic simulation) in FastAPI, not fully delegated to Celery task execution.

This is intentional for teaching clarity:
- the app can demonstrate queue/worker concepts and telemetry flows
- while keeping the behavior deterministic and easy to inspect in the lesson

For a focused note on this, see:
- `codex_plan_shot/docs/CELERY_ROLE_AND_CURRENT_USAGE.md`

---

## 12. Data and Persistence Notes

## Postgres (persisted)
Initialized via:
- `palantir_project/db/init.sql`

Used for persisted/system-oriented data such as:
- mission snapshots (best-effort sync from runtime mission state)
- hero scores
- telemetry event history (`telemetry_events`)

## Redis (runtime/hot state)
Used for:
- cache demo runtime values
- mission runtime state mirroring (`missions:runtime:state`)
- telemetry hot counters/feed/status caches
- emit-once idempotency guards for mission telemetry

## In-memory state (still used in places)
Some route-local structures still exist for demo logic convenience, but critical runtime continuity for missions/telemetry has been strengthened with Redis-backed state/guards.

---

## 13. Common Demo Flows (Recommended for Teaching)

## Flow A — Mission lifecycle + dashboard reaction
1. Open `/missoes`
2. Launch `Convocar a Sociedade (batch)`
3. Open `/dashboard`
4. Observe:
   - mission widget hero tokens activating
   - `Live Registros` animating in new mission events
   - lower panels updating mission/cache summaries
5. Return to `/missoes` and confirm missions remain visible while executing (cross-tab continuity)

## Flow B — Cache miss -> source read -> cache hit
1. Open `/biblioteca`
2. Click a region for the first time (e.g. `gondor`)
3. Observe miss/source/cache-write path in the UI and telemetry
4. Click the same region again
5. Observe cache hit and TTL behavior

## Flow C — SQL inspection of persisted events
1. Open `/biblioteca`
2. Go to `Explorador SQL (somente leitura)`
3. Run `Telemetry recente`
4. Observe event rows and correlate them to actions performed in other tabs

## Flow D — Architecture trace replay
1. Open `/arquitetura`
2. Click `Trace a Request`
3. Watch node/edge highlights replay through the topology
4. Read step details below for service/port/latency

---

## 14. Troubleshooting

## Page not updating after UI changes (stale browser state)
Try a hard refresh:
- `Ctrl+Shift+R`

## Frontend page loads but API actions fail
Check that `nginx` and `api` are running:

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project

docker compose ps
```

## Want a clean demo state (too many old events/missions)
Run a full reset:

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project

docker compose down --volumes --remove-orphans
docker compose up --build -d
```

## SQL explorer returns an error
The SQL explorer is intentionally restricted. Make sure your query is:
- `SELECT` only
- a single statement
- against allowed tables only (`telemetry_events`, `heroes`, `missions`)

---

## 15. Development Notes / References

## Plan folder (reference package only)
Use `codex_plan_shot/plan/` as the **planning and execution reference package for the whole app**.
It captures:
- original planning decisions
- API contracts and assumptions
- task journal/history of changes
- validation/acceptance notes

This README intentionally avoids repeating every individual plan file.

## Docs folder
Use `codex_plan_shot/docs/` for focused implementation notes (for example, Celery role/current usage).

---

## 16. Quick Start (Short Version)

```bash
cd /home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/05-anatomia-producao/project/codex_plan_shot/palantir_project
docker compose up --build -d
```

Then open:
- `http://localhost:5173` (frontend)
- `http://localhost:8080` (frontend/API via nginx)

Recommended learning path:
1. `/` (overview)
2. `/missoes` (launch jobs)
3. `/dashboard` (watch telemetry react)
4. `/biblioteca` (cache/rate limit/SQL)
5. `/arquitetura` (topology + trace replay)

---

## 17. Why This App Is Useful for "Anatomia de Produção"

This project is strong for teaching because it combines:
- **real infrastructure components** (nginx, redis, postgres, workers)
- **visual feedback loops** (dashboard widgets + animated event feed)
- **traceability** (architecture replay + terminal traces + SQL history)
- **controlled simulations** (predictable enough to teach, dynamic enough to feel real)
- **cross-page storytelling** (actions in one page propagate to others)

It helps learners understand not just *what* a service is, but *how systems behave together*.
