from datetime import datetime, timezone

from fastapi import APIRouter


router = APIRouter(prefix="/api/architecture", tags=["architecture"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _envelope(data: dict) -> dict:
    return {"data": data, "meta": {"timestamp": _now(), "source": "architecture"}}


@router.get("/diagram")
async def diagram() -> dict:
    nodes = [
        {
            "id": "client",
            "label": "User / Browser",
            "sublabel": "entry",
            "type": "client",
            "role": "client",
            "x_pct": 2.5,
            "y_pct": 29,
            "width_pct": 12,
            "image_key": "ui/palantir-orb.png",
            "tone": "blue",
            "port": None,
        },
        {
            "id": "nginx",
            "label": "Nginx Gateway",
            "sublabel": "reverse proxy",
            "type": "nginx",
            "role": "gateway",
            "x_pct": 19,
            "y_pct": 29,
            "width_pct": 18,
            "image_key": "locations/minas-tirith.png",
            "tone": "gold",
            "port": "80/443",
        },
        {
            "id": "gunicorn",
            "label": "Gunicorn",
            "sublabel": "WSGI workers",
            "type": "gunicorn",
            "role": "app-server",
            "x_pct": 40,
            "y_pct": 29,
            "width_pct": 15,
            "image_key": "locations/citadel.png",
            "tone": "gold",
            "port": "8000",
        },
        {
            "id": "fastapi",
            "label": "FastAPI",
            "sublabel": "app core",
            "type": "fastapi",
            "role": "app-core",
            "x_pct": 58,
            "y_pct": 29,
            "width_pct": 18,
            "image_key": "ui/header-logo.png",
            "tone": "green",
            "port": "8000",
            "render_mode": "emblem",
        },
        {
            "id": "redis",
            "label": "Redis",
            "sublabel": "cache",
            "type": "redis",
            "role": "cache",
            "x_pct": 77,
            "y_pct": 14,
            "width_pct": 17,
            "image_key": "locations/rivendell.png",
            "tone": "green",
            "port": "6379",
        },
        {
            "id": "postgres",
            "label": "Postgres",
            "sublabel": "persistence",
            "type": "postgres",
            "role": "db",
            "x_pct": 73,
            "y_pct": 50,
            "width_pct": 20,
            "image_key": "locations/minas-tirith-db.png",
            "tone": "blue",
            "port": "5432",
        },
        {
            "id": "broker",
            "label": "Broker",
            "sublabel": "queue relay",
            "type": "broker",
            "role": "broker",
            "x_pct": 51,
            "y_pct": 62,
            "width_pct": 17,
            "image_key": "locations/gondor-beacons.png",
            "tone": "amber",
            "port": "6379/queue",
        },
        {
            "id": "worker",
            "label": "Celery Worker",
            "sublabel": "async jobs",
            "type": "worker",
            "role": "worker",
            "x_pct": 29,
            "y_pct": 62,
            "width_pct": 19,
            "image_key": "locations/erebor.png",
            "tone": "gold",
            "port": "worker",
        },
    ]
    edges = [
        {"id": "e1", "from": "client", "to": "nginx", "animated": True, "kind": "sync", "tone": "gold", "path": [[14.5, 36], [21, 36]]},
        {"id": "e2", "from": "nginx", "to": "gunicorn", "animated": True, "kind": "sync", "tone": "gold", "path": [[37, 42], [40, 42]]},
        {"id": "e3", "from": "gunicorn", "to": "fastapi", "animated": True, "kind": "sync", "tone": "gold", "path": [[55, 42], [58, 42]]},
        {"id": "e4", "from": "fastapi", "to": "redis", "animated": True, "kind": "sync", "tone": "green", "path": [[76, 41], [76, 26], [79, 26]]},
        {"id": "e5", "from": "fastapi", "to": "postgres", "animated": True, "kind": "sync", "tone": "blue", "path": [[69, 46], [69, 59], [73, 59]]},
        {"id": "e6", "from": "fastapi", "to": "broker", "animated": True, "kind": "async", "tone": "amber", "path": [[61, 46], [61, 71], [51, 71]]},
        {"id": "e7", "from": "broker", "to": "worker", "animated": True, "kind": "async", "tone": "amber", "path": [[51, 74], [40, 74]]},
    ]
    return _envelope({"nodes": nodes, "edges": edges})


@router.get("/trace")
async def trace() -> dict:
    steps = [
        {
            "order": 1,
            "step": "gateway",
            "phase_label": "Gateway ingress",
            "service": "nginx",
            "node_id": "nginx",
            "edge_ids": ["e1"],
            "latency_ms": 3,
            "port": "80/443",
            "tone": "gold",
        },
        {
            "order": 2,
            "step": "app_server",
            "phase_label": "WSGI handoff",
            "service": "gunicorn",
            "node_id": "gunicorn",
            "edge_ids": ["e2"],
            "latency_ms": 5,
            "port": "8000",
            "tone": "gold",
            "worker_pid": 12345,
        },
        {
            "order": 3,
            "step": "api",
            "phase_label": "API handler",
            "service": "fastapi",
            "node_id": "fastapi",
            "edge_ids": ["e3"],
            "latency_ms": 6,
            "port": "8000",
            "tone": "green",
        },
        {
            "order": 4,
            "step": "cache",
            "phase_label": "Cache lookup",
            "service": "redis",
            "node_id": "redis",
            "edge_ids": ["e4"],
            "latency_ms": 2,
            "port": "6379",
            "tone": "green",
            "cache_event": "miss",
        },
        {
            "order": 5,
            "step": "db",
            "phase_label": "Primary read",
            "service": "postgres",
            "node_id": "postgres",
            "edge_ids": ["e5"],
            "latency_ms": 12,
            "port": "5432",
            "tone": "blue",
        },
        {
            "order": 6,
            "step": "enqueue",
            "phase_label": "Async dispatch",
            "service": "broker",
            "node_id": "broker",
            "edge_ids": ["e6"],
            "latency_ms": 4,
            "port": "6379/queue",
            "tone": "amber",
        },
        {
            "order": 7,
            "step": "worker",
            "phase_label": "Worker execution",
            "service": "celery",
            "node_id": "worker",
            "edge_ids": ["e7"],
            "latency_ms": 7,
            "port": "worker",
            "tone": "amber",
            "details": {"accent_image_key": "locations/erebor.png"},
        },
    ]
    return _envelope(
        {
            "trace_id": "trace_scaffold",
            "total_latency_ms": sum(step["latency_ms"] for step in steps),
            "steps": steps,
        }
    )
