from __future__ import annotations

import json
from collections import Counter, deque
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import redis

from ..config import settings
from .. import database

RECENT_LIMIT = 200
REDIS_FEED_KEY = "telemetry:feed:recent"
REDIS_SERVICE_STATUS_KEY = "telemetry:service_status"
REDIS_LAST_EVENT_AT_KEY = "telemetry:last_event_at"

_fallback_events: deque[dict[str, Any]] = deque(maxlen=RECENT_LIMIT)
_fallback_service_status: dict[str, dict[str, Any]] = {}
_redis_client: redis.Redis | None = None
_telemetry_schema_ensured = False


def _now_dt() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now_dt().isoformat()


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_timeout=0.25,
            socket_connect_timeout=0.25,
        )
    return _redis_client


def redis_available() -> bool:
    try:
        return bool(_redis().ping())
    except Exception:
        return False


def postgres_available() -> bool:
    return database.ping()


def backend_health() -> dict[str, bool]:
    return {"redis": redis_available(), "postgres": postgres_available()}


def _append_fallback_event(event: dict[str, Any]) -> None:
    _fallback_events.appendleft(event)
    _fallback_service_status[event["service"]] = {
        "service": event["service"],
        "status": "degraded" if event["status"] == "warn" else ("down" if event["status"] == "error" else "up"),
        "last_seen_at": event["created_at"],
    }


def _ensure_telemetry_table() -> None:
    global _telemetry_schema_ensured
    if _telemetry_schema_ensured:
        return
    database.execute(
        """
        CREATE TABLE IF NOT EXISTS telemetry_events (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          stage TEXT NOT NULL,
          service TEXT NOT NULL,
          status TEXT NOT NULL,
          label TEXT NOT NULL,
          entity_id TEXT NULL,
          latency_ms INTEGER NULL,
          payload_json JSONB NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    _telemetry_schema_ensured = True


def record_event(
    *,
    kind: str,
    stage: str,
    service: str,
    status: str,
    label: str,
    entity_id: str | None = None,
    latency_ms: int | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "id": f"evt_{uuid4().hex[:12]}",
        "kind": kind,
        "stage": stage,
        "service": service,
        "status": status,
        "label": label,
        "entity_id": entity_id,
        "latency_ms": latency_ms,
        "payload": payload or {},
        "created_at": _now_iso(),
    }
    _append_fallback_event(event)

    try:
        _ensure_telemetry_table()
        database.execute(
            """
            INSERT INTO telemetry_events
              (id, kind, stage, service, status, label, entity_id, latency_ms, payload_json, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
            """,
            (
                event["id"],
                kind,
                stage,
                service,
                status,
                label,
                entity_id,
                latency_ms,
                json.dumps(event["payload"]),
                event["created_at"],
            ),
        )
    except Exception:
        pass

    try:
        client = _redis()
        encoded = json.dumps(event)
        pipe = client.pipeline()
        pipe.lpush(REDIS_FEED_KEY, encoded)
        pipe.ltrim(REDIS_FEED_KEY, 0, RECENT_LIMIT - 1)
        pipe.set(REDIS_LAST_EVENT_AT_KEY, event["created_at"])
        pipe.hset(
            REDIS_SERVICE_STATUS_KEY,
            service,
            json.dumps(
                {
                    "service": service,
                    "status": "degraded" if status == "warn" else ("down" if status == "error" else "up"),
                    "last_seen_at": event["created_at"],
                }
            ),
        )
        pipe.execute()
    except Exception:
        pass

    return event


def set_service_status(service: str, status: str) -> None:
    snapshot = {"service": service, "status": status, "last_seen_at": _now_iso()}
    _fallback_service_status[service] = snapshot
    try:
        _redis().hset(REDIS_SERVICE_STATUS_KEY, service, json.dumps(snapshot))
    except Exception:
        pass


def recent_events(limit: int = 50) -> list[dict[str, Any]]:
    safe_limit = max(1, min(limit, RECENT_LIMIT))
    try:
        rows = _redis().lrange(REDIS_FEED_KEY, 0, safe_limit - 1)
        events = []
        for row in rows:
            try:
                events.append(json.loads(row))
            except json.JSONDecodeError:
                continue
        if events:
            return events
    except Exception:
        pass
    return list(_fallback_events)[:safe_limit]


def service_statuses() -> list[dict[str, Any]]:
    statuses: dict[str, dict[str, Any]] = {}
    try:
        raw = _redis().hgetall(REDIS_SERVICE_STATUS_KEY)
        for service, payload in raw.items():
            try:
                statuses[service] = json.loads(payload)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
    for service, snapshot in _fallback_service_status.items():
        statuses.setdefault(service, snapshot)
    return sorted(statuses.values(), key=lambda row: row["service"])


def _counts_from_events(events: list[dict[str, Any]]) -> dict[str, int]:
    now = _now_dt()
    window_start = now - timedelta(seconds=60)
    counts = Counter(
        {
            "requests": 0,
            "mission_events": 0,
            "library_events": 0,
            "redis_hits": 0,
            "redis_misses": 0,
            "postgres_writes": 0,
            "rate_limited": 0,
        }
    )
    for evt in events:
        dt = _parse_dt(evt.get("created_at"))
        if dt is None or dt < window_start:
            continue
        counts["requests"] += 1
        kind = str(evt.get("kind", ""))
        stage = str(evt.get("stage", ""))
        if kind.startswith("mission"):
            counts["mission_events"] += 1
        if kind.startswith("library"):
            counts["library_events"] += 1
        if "redis_hit" in stage:
            counts["redis_hits"] += 1
        if "redis_miss" in stage:
            counts["redis_misses"] += 1
        if "postgres_write" in stage or "db_read" in stage or stage in {"mission_persisted", "hero_scored"}:
            counts["postgres_writes"] += 1
        if "rate_limit" in stage and "blocked" in stage:
            counts["rate_limited"] += 1
    return dict(counts)


def ticker() -> dict[str, Any]:
    events = recent_events(RECENT_LIMIT)
    last_event_at = events[0]["created_at"] if events else None
    try:
        redis_last = _redis().get(REDIS_LAST_EVENT_AT_KEY)
        if redis_last:
            last_event_at = redis_last
    except Exception:
        pass
    return {"counts_60s": _counts_from_events(events), "last_event_at": last_event_at}


def overview_metrics() -> dict[str, Any]:
    tick = ticker()["counts_60s"]
    services = service_statuses()
    cache_total = tick["redis_hits"] + tick["redis_misses"]
    hit_rate = round((tick["redis_hits"] / cache_total) * 100, 1) if cache_total else 0.0
    overall = "up"
    if any(s.get("status") == "down" for s in services):
        overall = "down"
    elif any(s.get("status") == "degraded" for s in services):
        overall = "degraded"

    return {
        "services": services,
        "metrics": {
            "requests_per_second": round(tick["requests"] / 60, 2),
            "cache_hit_rate_pct": hit_rate,
            "active_workers": 2,
            "queue_depth": tick["mission_events"],
            "nginx_rate_limit_per_second": 10,
        },
        "health": {"overall_status": overall},
        "counts_60s": tick,
        "backend": backend_health(),
    }
