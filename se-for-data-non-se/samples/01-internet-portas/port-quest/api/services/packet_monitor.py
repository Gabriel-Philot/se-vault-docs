from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone

import httpx
import asyncpg

from models import Packet


_event_queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=1000)
_packets_count: int = 0
_last_reset: float = time.time()

SERVICE_PORTS = {
    "frontend": 3000,
    "gateway": 80,
    "api": 8000,
    "database": 5432,
}


def get_event_queue() -> asyncio.Queue[dict]:
    return _event_queue


def get_packets_per_second() -> float:
    global _packets_count, _last_reset
    now = time.time()
    elapsed = now - _last_reset
    if elapsed >= 10:
        rate = _packets_count / elapsed
        _packets_count = 0
        _last_reset = now
        return round(rate, 2)
    if elapsed > 0:
        return round(_packets_count / elapsed, 2)
    return 0.0


async def record_packet(pool: asyncpg.Pool, packet: Packet) -> Packet:
    global _packets_count
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO packet_log (source, destination, port, protocol, payload, latency_ms, status)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING id, timestamp""",
                packet.source,
                packet.destination,
                packet.port,
                packet.protocol,
                packet.payload,
                packet.latency_ms,
                packet.status,
            )
            if not packet.id:
                packet.id = str(row["id"])
            if not packet.timestamp:
                packet.timestamp = row["timestamp"].isoformat()
    except Exception:
        if not packet.id:
            packet.id = str(uuid.uuid4())[:8]
        if not packet.timestamp:
            packet.timestamp = datetime.now(timezone.utc).isoformat()

    _packets_count += 1

    event = {
        "id": str(packet.id),
        "source": packet.source,
        "source_port": packet.source_port or SERVICE_PORTS.get(packet.source, 0),
        "destination": packet.destination,
        "destination_port": packet.destination_port or SERVICE_PORTS.get(packet.destination, 0),
        "protocol": packet.protocol,
        "payload_preview": packet.payload_preview or (packet.payload or "")[:50],
        "latency_ms": packet.latency_ms,
        "status": packet.status,
        "timestamp": packet.timestamp or datetime.now(timezone.utc).isoformat(),
    }

    try:
        _event_queue.put_nowait(event)
    except asyncio.QueueFull:
        try:
            _event_queue.get_nowait()
        except asyncio.QueueEmpty:
            pass
        _event_queue.put_nowait(event)

    return packet


async def monitor_loop(pool: asyncpg.Pool) -> None:
    """Background task: probe gateway and database every 2 seconds."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        while True:
            # Probe gateway
            try:
                start = time.time()
                resp = await client.get("http://gateway:80/health")
                latency = round((time.time() - start) * 1000, 2)
                status = "delivered" if resp.status_code == 200 else "error"
            except Exception:
                latency = -1
                status = "timeout"

            await record_packet(
                pool,
                Packet(
                    id=str(uuid.uuid4())[:8],
                    source="api",
                    source_port=8000,
                    destination="gateway",
                    destination_port=80,
                    port=80,
                    protocol="HTTP",
                    payload="GET /health",
                    payload_preview="GET /health",
                    latency_ms=latency,
                    status=status,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ),
            )

            # Probe database
            try:
                start = time.time()
                async with pool.acquire() as conn:
                    await conn.fetchval("SELECT 1")
                latency = round((time.time() - start) * 1000, 2)
                status = "delivered"
            except Exception:
                latency = -1
                status = "timeout"

            await record_packet(
                pool,
                Packet(
                    id=str(uuid.uuid4())[:8],
                    source="api",
                    source_port=8000,
                    destination="database",
                    destination_port=5432,
                    port=5432,
                    protocol="SQL",
                    payload="SELECT 1",
                    payload_preview="SELECT 1",
                    latency_ms=latency,
                    status=status,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ),
            )

            await asyncio.sleep(2)
