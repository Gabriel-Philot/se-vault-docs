import asyncio
import re
import time
from datetime import date, datetime, time as dt_time, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Request, Response

from .. import database
from ..services import telemetry as telemetry_service

router = APIRouter(prefix="/api/library", tags=["library"])

_REGIONS = {
    "mordor": {"title": "Mordor", "description": "Dark volcanic wasteland.", "image_key": "regions/mordor.png"},
    "rohan": {"title": "Rohan", "description": "Golden plains and riders.", "image_key": "regions/rohan.png"},
    "gondor": {"title": "Gondor", "description": "White city and stone halls.", "image_key": "regions/gondor.png"},
    "shire": {"title": "Shire", "description": "Peaceful rolling hills.", "image_key": "regions/shire.png"},
    "rivendell": {"title": "Rivendell", "description": "Elven refuge and lore.", "image_key": "regions/rivendell-region.png"},
}
_HEROES = {k: {"hero": k, "display_name": v, "score": i * 10 + 50, "avatar_key": f"heroes/{k}.png"} for i, (k, v) in enumerate({
    "aragorn": "Aragorn", "legolas": "Legolas", "gimli": "Gimli", "gandalf": "Gandalf", "frodo": "Frodo",
    "samwise": "Samwise", "boromir": "Boromir", "eowyn": "Eowyn", "faramir": "Faramir", "galadriel": "Galadriel"
}.items())}
_HEROES["eagles"] = {"hero": "eagles", "display_name": "Eagles", "score": 90, "avatar_key": "locations/eagles.png"}
_KNOCKS: dict[str, int] = {}
_KNOCK_RESET_AT: dict[str, float] = {}
_REGION_CACHE: dict[str, dict] = {}
_CACHE_HITS = 0
_CACHE_MISSES = 0

_RATE_LIMIT = 5
_RATE_WINDOW_SECONDS = 60
_CACHE_TTL_SECONDS = 20
_SQL_ALLOWED_TABLES = {"telemetry_events", "heroes", "missions"}
_SQL_FORBIDDEN_TOKENS = {
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "create",
    "truncate",
    "grant",
    "revoke",
    "copy",
    "call",
    "execute",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _envelope(data: dict) -> dict:
    return {"data": data, "meta": {"timestamp": _now(), "source": "library"}}


def get_hero_snapshot(name: str) -> dict | None:
    hero = _HEROES.get(name)
    if not hero:
        return None
    return dict(hero)


def award_hero_points(name: str, points: int) -> dict:
    hero = _HEROES.get(name)
    if not hero:
        raise KeyError(name)
    hero["score"] += points
    try:
        database.execute(
            """
            INSERT INTO heroes (hero_key, display_name, score, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (hero_key)
            DO UPDATE SET display_name = EXCLUDED.display_name, score = EXCLUDED.score, updated_at = NOW()
            """,
            (hero["hero"], hero["display_name"], int(hero["score"])),
        )
    except Exception:
        pass
    return dict(hero)


def _validate_sql(query: str) -> str:
    q = query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Empty query")
    if "--" in q or "/*" in q or "*/" in q:
        raise HTTPException(status_code=403, detail="SQL comments are not allowed")
    if ";" in q:
        raise HTTPException(status_code=403, detail="Only a single statement is allowed")
    lowered = q.lower()
    if not lowered.startswith("select"):
        raise HTTPException(status_code=403, detail="Only SELECT queries are allowed")
    for token in _SQL_FORBIDDEN_TOKENS:
        if re.search(rf"\b{re.escape(token)}\b", lowered):
            raise HTTPException(status_code=403, detail=f"Forbidden SQL keyword: {token}")
    referenced = set(re.findall(r"\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)", lowered))
    if not referenced:
        raise HTTPException(status_code=422, detail="Could not identify referenced table")
    forbidden_tables = sorted(referenced - _SQL_ALLOWED_TABLES)
    if forbidden_tables:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden table(s): {', '.join(forbidden_tables)}",
        )
    if not re.search(r"\blimit\s+\d+\b", lowered):
        q = f"{q}\nLIMIT 200"
    return q


def _json_safe_cell(value):
    if isinstance(value, (datetime, date, dt_time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode(errors="replace")
    if isinstance(value, list):
        return [_json_safe_cell(item) for item in value]
    if isinstance(value, dict):
        return {str(k): _json_safe_cell(v) for k, v in value.items()}
    return value


@router.get("/region/{name}")
async def get_region(name: str) -> dict:
    global _CACHE_HITS, _CACHE_MISSES
    region = _REGIONS.get(name)
    if not region:
        raise HTTPException(status_code=404, detail="Unknown region")

    now = time.time()
    cached = _REGION_CACHE.get(name)
    if cached and cached["expires_at"] > now:
        _CACHE_HITS += 1
        ttl_remaining = int(max(0, cached["expires_at"] - now))
        telemetry_service.record_event(
            kind="library.region.lookup",
            stage="redis_hit",
            service="redis",
            status="success",
            label=f"Region cache hit: {name}",
            entity_id=name,
            latency_ms=20,
        )
        return _envelope(
            {
                "region": name,
                **region,
                "cached": True,
                "ttl_seconds_remaining": ttl_remaining,
                "source_latency_ms": 20,
            }
        )

    _CACHE_MISSES += 1
    telemetry_service.record_event(
        kind="library.region.lookup",
        stage="redis_miss",
        service="redis",
        status="warn",
        label=f"Region cache miss: {name}",
        entity_id=name,
    )
    await asyncio.sleep(0.25)
    _REGION_CACHE[name] = {"expires_at": now + _CACHE_TTL_SECONDS}
    telemetry_service.record_event(
        kind="library.region.lookup",
        stage="db_read_simulated",
        service="postgres",
        status="info",
        label=f"Region source read: {name}",
        entity_id=name,
        latency_ms=250,
    )
    telemetry_service.record_event(
        kind="library.region.lookup",
        stage="cache_write",
        service="redis",
        status="success",
        label=f"Region cached: {name}",
        entity_id=name,
        latency_ms=5,
    )
    return _envelope(
        {
            "region": name,
            **region,
            "cached": False,
            "ttl_seconds_remaining": _CACHE_TTL_SECONDS,
            "source_latency_ms": 250,
        }
    )


@router.post("/gate/knock")
async def gate_knock(request: Request, response: Response) -> dict:
    client = request.client.host if request.client else "unknown"
    now = time.time()
    reset_at = _KNOCK_RESET_AT.get(client, 0.0)
    if now >= reset_at:
        _KNOCKS[client] = 0
        _KNOCK_RESET_AT[client] = now + _RATE_WINDOW_SECONDS
        reset_at = _KNOCK_RESET_AT[client]

    count = _KNOCKS.get(client, 0) + 1
    _KNOCKS[client] = count
    remaining = max(0, _RATE_LIMIT - count)
    allowed = count <= _RATE_LIMIT
    reset_in_seconds = int(max(0, reset_at - now))

    response.headers["X-RateLimit-Limit"] = str(_RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_in_seconds)

    payload = {
        "allowed": allowed,
        "message": "Gate open" if allowed else "Gate closed",
        "remaining": remaining,
        "limit": _RATE_LIMIT,
        "reset_in_seconds": reset_in_seconds,
    }
    if not allowed:
        telemetry_service.record_event(
            kind="library.gate.knock",
            stage="rate_limit_blocked",
            service="nginx",
            status="error",
            label="Gate knock blocked",
            entity_id=client,
        )
        response.status_code = 429
        return {"error": {"code": "RATE_LIMITED", "message": "Gate closed", "details": payload}, "meta": {"timestamp": _now(), "source": "library"}}
    telemetry_service.record_event(
        kind="library.gate.knock",
        stage="rate_limit_allowed",
        service="nginx",
        status="success",
        label="Gate knock allowed",
        entity_id=client,
    )
    return _envelope(payload)


@router.post("/heroes/{name}/feat")
async def add_feat(name: str, payload: dict | None = None) -> dict:
    hero = _HEROES.get(name)
    if not hero:
        raise HTTPException(status_code=404, detail="Unknown hero")
    points = int((payload or {}).get("points", 10))
    if points <= 0 or points > 1000:
        raise HTTPException(status_code=400, detail="Invalid points")
    await asyncio.sleep(0.08)
    hero["score"] += points
    try:
        database.execute(
            """
            INSERT INTO heroes (hero_key, display_name, score, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (hero_key)
            DO UPDATE SET display_name = EXCLUDED.display_name, score = EXCLUDED.score, updated_at = NOW()
            """,
            (hero["hero"], hero["display_name"], int(hero["score"])),
        )
    except Exception:
        pass
    telemetry_service.record_event(
        kind="library.hero.feat",
        stage="postgres_write_simulated",
        service="postgres",
        status="success",
        label=f"Feat recorded for {name}",
        entity_id=name,
        payload={"points": points, "new_score": hero["score"]},
    )
    telemetry_service.record_event(
        kind="library.hero.feat",
        stage="leaderboard_update",
        service="fastapi",
        status="info",
        label=f"Leaderboard updated for {name}",
        entity_id=name,
    )
    return _envelope({"hero": name, "new_score": hero["score"]})


@router.get("/heroes/leaderboard")
async def leaderboard() -> dict:
    telemetry_service.record_event(
        kind="library.hero.leaderboard",
        stage="read",
        service="fastapi",
        status="info",
        label="Leaderboard fetched",
    )
    sorted_entries = sorted(_HEROES.values(), key=lambda e: (-e["score"], e["hero"]))
    entries = []
    for idx, row in enumerate(sorted_entries[:10], start=1):
        entries.append({"rank": idx, **row})
    return _envelope({"entries": entries})


@router.get("/stats")
async def library_stats() -> dict:
    total = _CACHE_HITS + _CACHE_MISSES
    hit_rate = round((_CACHE_HITS / total) * 100, 2) if total else 0.0
    backends = telemetry_service.backend_health()
    return _envelope(
        {
            "redis_connected": backends["redis"],
            "keys_estimate": len(_REGION_CACHE) + len(_HEROES) + len(_KNOCKS),
            "memory_used_human": None,
            "cache_hit_rate_pct": hit_rate,
            "postgres_connected": backends["postgres"],
        }
    )


@router.post("/sql")
async def read_only_sql(payload: dict | None = None) -> dict:
    request_payload = payload or {}
    query = str(request_payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Field 'query' is required")

    validated_query = _validate_sql(query)
    try:
        rows = database.fetch_all(validated_query)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Read-only query execution failed") from None

    columns = list(rows[0].keys()) if rows else []
    matrix = [[_json_safe_cell(row.get(col)) for col in columns] for row in rows]
    telemetry_service.record_event(
        kind="library.sql.readonly",
        stage="query_executed",
        service="postgres",
        status="success",
        label="Read-only SQL executed",
        payload={"columns": columns, "row_count": len(rows)},
    )
    return _envelope(
        {
            "columns": columns,
            "rows": matrix,
            "row_count": len(rows),
            "truncated": len(rows) >= 200,
        }
    )
