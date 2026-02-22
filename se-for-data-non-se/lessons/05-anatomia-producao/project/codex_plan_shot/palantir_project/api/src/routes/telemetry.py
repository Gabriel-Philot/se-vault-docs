from datetime import datetime, timezone

from fastapi import APIRouter

from ..services import telemetry as telemetry_service

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _envelope(data: dict) -> dict:
    return {"data": data, "meta": {"timestamp": _now(), "source": "telemetry"}}


@router.get("/overview")
async def overview() -> dict:
    return _envelope(telemetry_service.overview_metrics())


@router.get("/feed")
async def feed(limit: int = 50) -> dict:
    return _envelope({"events": telemetry_service.recent_events(limit)})


@router.get("/ticker")
async def ticker() -> dict:
    return _envelope(telemetry_service.ticker())

