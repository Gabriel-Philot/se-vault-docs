# DataFlow Lab (035-OPP project-folder)

Integrated practical app for OPP patterns in data engineering.

## What this simulates

- User creates a fake purchase in the UI.
- Order lifecycle progresses automatically:
  - `CREATED` (immediate)
  - `PAYMENT_PENDING` (+2s)
  - `COMPLETED` (+5s total)
- Every status change emits CDC-like events (Debezium-style envelope simulated).
- Pipeline processes events with pattern-oriented components.

## Patterns represented

- Strategy: tax transform by country.
- Factory: sink creation.
- Template Method + Composition: fixed lifecycle plus stage processing.
- Adapter: Debezium envelope to canonical event.
- Observer/PubSub: SSE event publishing.
- Idempotent Consumer: dedupe by event id.
- Router/Translator/Aggregator: route by value, transform payload, update analytics.

## Run

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

## Main endpoints

- `GET /api/products`
- `POST /api/orders/create`
- `GET /api/orders/list`
- `GET /api/analytics/summary`
- `POST /api/orders/replay-last-event`
- `POST /api/pipeline/config`
- `POST /api/sim/reset`
- `GET /api/stream/events`

