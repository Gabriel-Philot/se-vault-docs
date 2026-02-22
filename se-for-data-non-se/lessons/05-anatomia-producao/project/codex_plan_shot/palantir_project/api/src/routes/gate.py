import os
from datetime import datetime, timezone

from fastapi import APIRouter

from ..services import telemetry as telemetry_service

router = APIRouter(prefix="/api/gate", tags=["gate"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _envelope(data: dict) -> dict:
    return {"data": data, "meta": {"timestamp": _now(), "source": "gate"}}


@router.get("/workers")
async def workers() -> dict:
    return _envelope({"workers": [{"worker_pid": os.getpid(), "parent_pid": os.getppid()}]})


@router.get("/stats")
async def stats() -> dict:
    overview = telemetry_service.overview_metrics()
    metrics = overview["metrics"]
    return _envelope(
        {
            "workers": [{"worker_pid": os.getpid(), "parent_pid": os.getppid()}],
            "queue_depth": metrics["queue_depth"],
            "active_tasks": metrics["queue_depth"],
            "gateway": {
                "requests_per_second": metrics["requests_per_second"],
                "cache_hit_rate_pct": metrics["cache_hit_rate_pct"],
                "active_workers": metrics["active_workers"],
                "queue_depth": metrics["queue_depth"],
                "nginx_rate_limit_per_second": metrics["nginx_rate_limit_per_second"],
            },
        }
    )


@router.get("/health")
async def health() -> dict:
    backends = telemetry_service.backend_health()
    telemetry_service.set_service_status("nginx", "up")
    telemetry_service.set_service_status("api", "up")
    telemetry_service.set_service_status("frontend", "up")
    telemetry_service.set_service_status("redis", "up" if backends["redis"] else "degraded")
    telemetry_service.set_service_status("postgres", "up" if backends["postgres"] else "degraded")
    telemetry_service.set_service_status("celery", "degraded")
    services = [
        {"service": "nginx", "status": "up"},
        {"service": "api", "status": "up"},
        {"service": "redis", "status": "up" if backends["redis"] else "degraded"},
        {"service": "celery", "status": "degraded"},
        {"service": "postgres", "status": "up" if backends["postgres"] else "degraded"},
        {"service": "frontend", "status": "up"},
    ]
    overall = "up" if backends["redis"] and backends["postgres"] else "degraded"
    return _envelope({"services": services, "overall_status": overall})
