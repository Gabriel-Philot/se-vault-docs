import asyncio
import random
import time
from collections import defaultdict
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from . import library as library_routes
from .. import database
from ..services import telemetry as telemetry_service

router = APIRouter(prefix="/api/missions", tags=["missions"])

_MISSIONS: dict[str, dict] = {}
_HERO_ROTATION = {"recon": 0, "consult": 0, "raven": 0}
_HERO_POOLS = {
    "recon": ["aragorn", "legolas", "faramir"],
    "consult": ["gandalf", "galadriel", "samwise"],
    "raven": ["eagles"],
}
_ARTIFACT_BY_MISSION = {
    "recon": "seeing-stone",
    "consult": "elven-scroll",
    "raven": "raven-sigil",
}
_POINTS_BY_MISSION = {
    "recon": (10, 18),
    "consult": (12, 20),
    "raven": (8, 14),
}
_SERVICE_PORTS = {
    "fastapi": "8000",
    "broker": "6379/queue",
    "redis": "6379",
    "postgres": "5432",
    "celery": "worker",
    "nginx": "80/443",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _envelope(data: dict) -> dict:
    return {"data": data, "meta": {"timestamp": _now(), "source": "missions"}}


def _choose_hero(mission_type: str) -> tuple[str, str]:
    pool = _HERO_POOLS[mission_type]
    idx = _HERO_ROTATION[mission_type] % len(pool)
    _HERO_ROTATION[mission_type] += 1
    hero_key = pool[idx]
    hero_snapshot = library_routes.get_hero_snapshot(hero_key)
    hero_display = hero_snapshot["display_name"] if hero_snapshot else hero_key.title()
    return hero_key, hero_display


def _mission_payload(mission: dict, **extra: object) -> dict:
    payload = {
        "mission_id": mission["id"],
        "mission_type": mission["mission_type"],
        "hero_key": mission["hero_key"],
        "hero_display_name": mission["hero_display_name"],
        "hero_avatar_key": mission.get("hero_avatar_key"),
        "artifact_key": mission.get("artifact_key"),
        "progress_pct": mission.get("progress_pct", 0),
        "phase_ui": mission.get("phase_ui", "INVOKED"),
    }
    payload.update(extra)
    return payload


def _persist_mission_snapshot(mission: dict) -> None:
    try:
        database.execute(
            """
            INSERT INTO missions (id, mission_type, status, progress_pct, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id)
            DO UPDATE SET
              mission_type = EXCLUDED.mission_type,
              status = EXCLUDED.status,
              progress_pct = EXCLUDED.progress_pct,
              updated_at = EXCLUDED.updated_at
            """,
            (
                mission["id"],
                mission["mission_type"],
                mission["status"],
                int(mission.get("progress_pct", 0)),
                mission["created_at"],
                mission["updated_at"],
            ),
        )
    except Exception:
        pass


def _new_mission(mission_type: str) -> dict:
    hero_key, hero_display = _choose_hero(mission_type)
    hero_snapshot = library_routes.get_hero_snapshot(hero_key) or {}
    execution_duration_s = round(random.uniform(2.0, 4.0), 2)
    queue_delay_s = round(random.uniform(0.12, 0.28), 2)
    persist_delay_s = round(random.uniform(0.10, 0.22), 2)
    score_delay_s = round(random.uniform(0.05, 0.14), 2)
    should_retry = uuid4().int % 5 == 0
    mission_id = f"mission_{uuid4().hex[:10]}"
    mission = {
        "id": mission_id,
        "mission_type": mission_type,
        "status": "PENDING",
        "progress_pct": 0,
        "duration_s": execution_duration_s,
        "execution_duration_s": execution_duration_s,
        "queue_delay_s": queue_delay_s,
        "persist_delay_s": persist_delay_s,
        "score_delay_s": score_delay_s,
        "started_monotonic": time.monotonic(),
        "should_retry": should_retry,
        "phase_ui": "INVOKED",
        "hero_key": hero_key,
        "hero_display_name": hero_display,
        "hero_avatar_key": hero_snapshot.get("avatar_key", f"heroes/{hero_key}.png"),
        "artifact_key": _ARTIFACT_BY_MISSION[mission_type],
        "points_awarded": random.randint(*_POINTS_BY_MISSION[mission_type]),
        "steps": [
            {"key": "queued", "label": "Queued", "state": "pending"},
            {"key": "dispatch", "label": "Dispatch", "state": "pending"},
            {"key": "process", "label": "Process", "state": "pending"},
            {"key": "complete", "label": "Complete", "state": "pending"},
        ],
        "created_at": _now(),
        "updated_at": _now(),
        "last_emitted_bucket": -1,
        "terminal_event_emitted": False,
        "executing_event_emitted": False,
        "persisted_event_emitted": False,
        "scored_event_emitted": False,
        "score_applied": False,
    }
    _MISSIONS[mission_id] = mission
    _persist_mission_snapshot(mission)
    telemetry_service.record_event(
        kind=f"mission.{mission_type}",
        stage="mission_invoked",
        service="fastapi",
        status="success",
        label=f"Mission invoked: {mission_type} ({hero_display})",
        entity_id=mission_id,
        payload=_mission_payload(mission, phase_ui="INVOKED"),
    )
    telemetry_service.record_event(
        kind=f"mission.{mission_type}",
        stage="mission_queued",
        service="broker",
        status="info",
        label=f"Mission queued: {mission_type}",
        entity_id=mission_id,
        payload=_mission_payload(mission, phase_ui="QUEUED"),
    )
    return mission


def _refresh_mission(mission: dict) -> dict:
    elapsed = time.monotonic() - mission["started_monotonic"]
    queue_end = mission["queue_delay_s"]
    exec_end = queue_end + mission["execution_duration_s"]
    persist_end = exec_end + mission["persist_delay_s"]
    score_end = persist_end + mission["score_delay_s"]

    status_value = mission["status"]
    progress = 0
    phase_ui = "INVOKED"
    if elapsed < queue_end:
        status_value = "STARTED"
        progress = int(min(12, max(2, (elapsed / max(queue_end, 0.01)) * 12)))
        phase_ui = "QUEUED"
    elif elapsed < exec_end:
        exec_ratio = (elapsed - queue_end) / max(mission["execution_duration_s"], 0.01)
        progress = int(12 + max(0.0, min(1.0, exec_ratio)) * 78)
        status_value = "RETRY" if mission["should_retry"] and 0.55 <= exec_ratio < 0.75 else "PROCESSING"
        phase_ui = "EXECUTING"
    elif elapsed < persist_end:
        status_value = "SUCCESS"
        progress = 92
        phase_ui = "COMPLETED"
    elif elapsed < score_end:
        status_value = "SUCCESS"
        progress = 97
        phase_ui = "PERSISTED"
    else:
        status_value = "SUCCESS"
        progress = 100
        phase_ui = "SCORED"

    mission["status"] = status_value
    mission["progress_pct"] = progress
    mission["phase_ui"] = phase_ui
    mission["updated_at"] = _now()
    _persist_mission_snapshot(mission)

    step_states = ["pending", "pending", "pending", "pending"]
    if progress > 0:
        step_states[0] = "done"
    if progress >= 25:
        step_states[1] = "done"
    if status_value in {"PROCESSING", "RETRY", "SUCCESS"}:
        step_states[2] = "active" if status_value != "SUCCESS" else "done"
    if status_value == "RETRY":
        step_states[2] = "error"
    if status_value == "SUCCESS":
        step_states[3] = "done"

    for step, state in zip(mission["steps"], step_states, strict=False):
        step["state"] = state

    if phase_ui == "EXECUTING" and not mission.get("executing_event_emitted"):
        mission["executing_event_emitted"] = True
        telemetry_service.record_event(
            kind=f"mission.{mission['mission_type']}",
            stage="mission_executing",
            service="celery",
            status="warn" if status_value == "RETRY" else "info",
            label=f"Hero executing: {mission['hero_display_name']}",
            entity_id=mission["id"],
            payload=_mission_payload(mission, phase_ui="EXECUTING"),
        )

    bucket = min(100, (progress // 20) * 20)
    if phase_ui == "EXECUTING" and bucket > mission.get("last_emitted_bucket", -1):
        mission["last_emitted_bucket"] = bucket
        telemetry_service.record_event(
            kind=f"mission.{mission['mission_type']}",
            stage="mission_progress",
            service="celery",
            status="warn" if status_value == "RETRY" else "info",
            label=f"Mission {mission['mission_type']} {progress}%",
            entity_id=mission["id"],
            payload=_mission_payload(mission, progress_pct=progress, status=status_value, phase_ui="EXECUTING"),
        )

    if phase_ui == "COMPLETED" and not mission.get("terminal_event_emitted"):
        mission["terminal_event_emitted"] = True
        telemetry_service.record_event(
            kind=f"mission.{mission['mission_type']}",
            stage="mission_completed",
            service="celery",
            status="success",
            label=f"Mission completed: {mission['mission_type']} ({mission['hero_display_name']})",
            entity_id=mission["id"],
            payload=_mission_payload(mission, phase_ui="COMPLETED"),
        )

    if phase_ui in {"PERSISTED", "SCORED"} and not mission.get("persisted_event_emitted"):
        mission["persisted_event_emitted"] = True
        telemetry_service.record_event(
            kind=f"mission.{mission['mission_type']}",
            stage="mission_persisted",
            service="postgres",
            status="success",
            label=f"Mission result persisted: {mission['mission_type']}",
            entity_id=mission["id"],
            payload=_mission_payload(mission, phase_ui="PERSISTED"),
        )

    if phase_ui == "SCORED" and not mission.get("scored_event_emitted"):
        mission["scored_event_emitted"] = True
        if not mission.get("score_applied"):
            mission["score_applied"] = True
            hero_after = library_routes.award_hero_points(mission["hero_key"], int(mission["points_awarded"]))
            mission["hero_new_score"] = hero_after["score"]
        telemetry_service.record_event(
            kind=f"mission.{mission['mission_type']}",
            stage="hero_scored",
            service="postgres",
            status="success",
            label=f"Hero scored +{mission['points_awarded']}: {mission['hero_display_name']}",
            entity_id=mission["hero_key"],
            payload=_mission_payload(
                mission,
                phase_ui="SCORED",
                points_awarded=mission["points_awarded"],
                new_score=mission.get("hero_new_score"),
                source_mission_id=mission["id"],
            ),
        )
        telemetry_service.record_event(
            kind="library.hero.mission_reward",
            stage="leaderboard_update",
            service="fastapi",
            status="info",
            label=f"Leaderboard updated for {mission['hero_display_name']}",
            entity_id=mission["hero_key"],
            payload=_mission_payload(
                mission,
                phase_ui="SCORED",
                points_awarded=mission["points_awarded"],
                new_score=mission.get("hero_new_score"),
                source_mission_id=mission["id"],
            ),
        )

    return mission


def _mission_trace_rows(limit: int) -> list[dict]:
    safe_limit = max(1, min(limit, 50))
    try:
        rows = database.fetch_all(
            """
            SELECT id, kind, stage, service, status, label, entity_id, latency_ms, payload_json, created_at
            FROM telemetry_events
            WHERE kind LIKE 'mission.%' OR kind = 'library.hero.mission_reward'
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (max(200, safe_limit * 25),),
        )
    except Exception:
        rows = telemetry_service.recent_events(max(200, safe_limit * 25))
    return rows


def _payload_from_event_row(row: dict) -> dict:
    payload = row.get("payload_json", row.get("payload", {})) or {}
    return payload if isinstance(payload, dict) else {}


def _trace_status_from_steps(steps: list[dict]) -> str:
    if not steps:
        return "UNKNOWN"
    stages = [str(step.get("stage", "")) for step in steps]
    if any(stage == "hero_scored" for stage in stages):
        return "SCORED"
    if any(stage == "mission_persisted" for stage in stages):
        return "PERSISTED"
    if any(stage == "mission_completed" for stage in stages):
        return "COMPLETED"
    if any(stage == "mission_executing" for stage in stages):
        return "EXECUTING"
    if any(stage == "mission_queued" for stage in stages):
        return "QUEUED"
    return "INVOKED"


def _build_mission_traces(limit: int) -> list[dict]:
    rows = _mission_trace_rows(limit)
    grouped: dict[str, list[dict]] = defaultdict(list)
    order_hint: dict[str, str] = {}

    for row in rows:
        payload = _payload_from_event_row(row)
        mission_id = (
            payload.get("mission_id")
            or payload.get("source_mission_id")
            or (row.get("entity_id") if str(row.get("entity_id", "")).startswith("mission_") else None)
        )
        if not mission_id:
            continue
        normalized = {
            "id": row.get("id"),
            "kind": row.get("kind"),
            "stage": row.get("stage"),
            "service": row.get("service"),
            "status": row.get("status"),
            "label": row.get("label"),
            "entity_id": row.get("entity_id"),
            "latency_ms": row.get("latency_ms"),
            "created_at": str(row.get("created_at")),
            "payload": payload,
        }
        grouped[str(mission_id)].append(normalized)
        order_hint[str(mission_id)] = str(row.get("created_at"))

    traces: list[dict] = []
    for mission_id, events in sorted(order_hint.items(), key=lambda item: item[1], reverse=True)[: max(1, min(limit, 50))]:
        mission_events = grouped[mission_id]
        mission_events.sort(key=lambda evt: evt["created_at"])
        first_payload = next((e.get("payload", {}) for e in mission_events if e.get("payload")), {})
        steps = []
        for idx, evt in enumerate(mission_events, start=1):
            steps.append(
                {
                    "order": idx,
                    "service": evt["service"],
                    "stage": evt["stage"],
                    "port": _SERVICE_PORTS.get(str(evt["service"]), None),
                    "label": evt["label"],
                    "created_at": evt["created_at"],
                    "status": evt.get("status"),
                    "payload": evt.get("payload") or None,
                }
            )
        traces.append(
            {
                "mission_id": mission_id,
                "mission_type": first_payload.get("mission_type"),
                "hero_key": first_payload.get("hero_key"),
                "hero_display_name": first_payload.get("hero_display_name"),
                "status": _trace_status_from_steps(steps),
                "started_at": steps[0]["created_at"] if steps else None,
                "ended_at": steps[-1]["created_at"] if steps else None,
                "steps": steps,
            }
        )
    return traces


@router.post("/recon", status_code=status.HTTP_202_ACCEPTED)
async def launch_recon() -> dict:
    await asyncio.sleep(0.05)
    return _envelope(_new_mission("recon"))


@router.post("/consult", status_code=status.HTTP_202_ACCEPTED)
async def launch_consult() -> dict:
    await asyncio.sleep(0.05)
    return _envelope(_new_mission("consult"))


@router.post("/raven", status_code=status.HTTP_202_ACCEPTED)
async def launch_raven() -> dict:
    await asyncio.sleep(0.03)
    return _envelope(_new_mission("raven"))


@router.post("/fellowship", status_code=status.HTTP_202_ACCEPTED)
async def launch_fellowship() -> dict:
    await asyncio.sleep(0.08)
    launched = [_new_mission(kind) for kind in ["recon", "consult", "raven", "recon", "raven"]]
    telemetry_service.record_event(
        kind="mission.fellowship",
        stage="batch_started",
        service="fastapi",
        status="success",
        label="Fellowship batch launched",
        payload={"size": len(launched)},
    )
    return _envelope({"batch_id": f"batch_{uuid4().hex[:8]}", "launched": launched})


@router.get("/traces")
async def list_mission_traces(limit: int = 12) -> dict:
    traces = _build_mission_traces(limit)
    return _envelope({"traces": traces})


@router.get("/{mission_id}")
async def get_mission(mission_id: str) -> dict:
    mission = _MISSIONS.get(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return _envelope(_refresh_mission(mission))


@router.get("")
async def list_missions(limit: int = 20) -> dict:
    missions = [_refresh_mission(m) for m in _MISSIONS.values()]
    missions.sort(key=lambda item: item["created_at"], reverse=True)
    missions = missions[: max(1, min(limit, 100))]
    return _envelope({"missions": missions})
