# Celery Executors: Current Role In This Project

## Short Answer

The Celery executors (`worker`, `worker-2`) are present as **real infra components** in the stack, but they are currently used mostly to support the **architecture/teaching narrative** (queue + async worker pattern) rather than running the full mission lifecycle end-to-end.

Today, most mission progression is still simulated inside FastAPI (`/api/missions`) and represented in telemetry as if it flowed through broker/worker stages.

## What Is Actually Running

Two Celery worker containers are started in Docker Compose:

- `worker` (`eagle1`)
- `worker-2` (`eagle2`)

They run a Celery worker process using `src.tasks:celery_app`.

References:
- `codex_plan_shot/palantir_project/docker-compose.yml:25`
- `codex_plan_shot/palantir_project/docker-compose.yml:37`

## Celery App and Registered Task (Current State)

The project defines a real Celery app and one scaffold task:

- `celery_app = Celery(...)`
- task: `palantir.missions.echo`

This task currently just returns a simple dict and is a scaffold/demo task.

References:
- `codex_plan_shot/palantir_project/api/src/tasks.py:6`
- `codex_plan_shot/palantir_project/api/src/tasks.py:13`

## What Missions Are Doing Right Now (Important)

Mission lifecycle behavior (invoke, queued, executing, persisted, scored) is currently driven in FastAPI route logic and in-memory mission state:

- in-memory store: `_MISSIONS`
- timing/progress simulation
- telemetry events emitted for phases (`broker`, `celery`, `postgres`, etc.)
- Postgres mission snapshot persistence (best-effort)

References:
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:16`
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:76`
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:102`

### Why It Looks Like Celery Is Executing Missions

The route emits telemetry with `service="celery"` during mission execution/progress/completion phases. That is intentional for the educational flow and dashboard/architecture visualization.

Examples:
- `mission_executing` emitted as `service="celery"`
- `mission_progress` emitted as `service="celery"`
- `mission_completed` emitted as `service="celery"`

References:
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:223`
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:236`
- `codex_plan_shot/palantir_project/api/src/routes/missions.py:248`

## What Celery Executors Are Contributing Right Now

They currently contribute mainly to:

- **Infrastructure realism**: queue + workers exist in the running stack
- **Architecture teaching**: `broker -> worker` is not just theoretical in Compose
- **Telemetry/UX narrative alignment**: dashboard and architecture pages can show async concepts coherently
- **Future-ready execution path**: the Celery app/worker infra is already in place for migrating mission execution

## What Is Not Yet Using Celery End-to-End

At the moment, mission routes are not dispatching real Celery tasks for mission execution flow (the main lifecycle is simulated in FastAPI). The visible async behavior is mostly represented through route-side timing + telemetry.

Practical implication:
- the **conceptual flow** is async and correctly visualized
- the **domain execution engine** is not fully offloaded to Celery yet

## Why This Is OK For The Lesson (Current Phase)

This setup is useful pedagogically because it lets the project teach:

- request flow (`nginx -> gunicorn -> fastapi`)
- queue/worker concepts (`broker -> celery worker`)
- cache/db touches (`redis`, `postgres`)
- telemetry and dashboards

...without forcing full background orchestration complexity too early.

## Natural Next Step (If We Want Full Celery Execution Later)

To make Celery the true executor of missions end-to-end, the next migration would be:

1. FastAPI route creates mission record and dispatches a Celery task
2. Celery worker executes mission stages and updates mission state
3. Worker emits telemetry directly for execution/persist/score stages
4. FastAPI mostly becomes orchestration/query API (launch + status + history)

That would move the current simulated route-side mission engine into a real worker-side execution engine.

