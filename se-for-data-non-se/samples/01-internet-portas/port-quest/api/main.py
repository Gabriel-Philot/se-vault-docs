from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from datetime import datetime, timezone

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from models import (
    Building,
    ChallengeResult,
    ChallengeSubmission,
    CityStatus,
    Connection,
    FirewallRule,
    Packet,
    TLSStep,
)
from services import city_state, challenge_engine, dns_simulator, packet_monitor

app = FastAPI(title="Port Quest - City Hall API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_pool: asyncpg.Pool | None = None


@app.on_event("startup")
async def startup() -> None:
    global db_pool
    database_url = os.getenv("DATABASE_URL", "postgresql://portquest:portquest@database:5432/portquest")
    for attempt in range(10):
        try:
            db_pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)
            break
        except Exception:
            if attempt < 9:
                await asyncio.sleep(2)
            else:
                raise

    await challenge_engine.load_challenges(db_pool)
    asyncio.create_task(packet_monitor.monitor_loop(db_pool))


@app.on_event("shutdown")
async def shutdown() -> None:
    global db_pool
    if db_pool:
        await db_pool.close()


# --- City endpoints ---

@app.get("/api/city/status")
async def city_status():
    pps = packet_monitor.get_packets_per_second()
    status = city_state.get_city_status(pps)
    return status.model_dump()


@app.get("/api/city/connections")
async def city_connections():
    conns = city_state.get_connections()
    return [c.model_dump() for c in conns]


# --- Packet endpoints ---

@app.get("/api/packets/stream")
async def packet_stream():
    queue = packet_monitor.get_event_queue()

    async def event_generator():
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {"event": "packet", "data": json.dumps(event)}
            except asyncio.TimeoutError:
                yield {"event": "heartbeat", "data": json.dumps({"type": "keepalive"})}

    return EventSourceResponse(event_generator())


class SendPacketRequest(BaseModel):
    source: str = "browser"
    destination: str = "gateway"
    protocol: str = "HTTP"
    payload: str = ""


@app.post("/api/packets/send")
async def send_packet(req: SendPacketRequest):
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database not available")

    dest_service = _resolve_service(req.destination)
    dest_port = city_state.get_service_port(dest_service) or 80

    packet = Packet(
        id=str(uuid.uuid4())[:8],
        source=req.source,
        source_port=0,
        destination=dest_service,
        destination_port=dest_port,
        port=dest_port,
        protocol=req.protocol,
        payload=req.payload or f"GET {req.destination}",
        payload_preview=f"GET {req.destination}"[:50],
        status="traveling",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    if not city_state.check_firewall(packet.source, packet.destination, packet.port):
        packet.status = "blocked"
        packet.latency_ms = 0
        return await packet_monitor.record_packet(db_pool, packet)

    target_map = {
        "gateway": "http://gateway:80/health",
        "api": "http://localhost:8000/api/city/status",
        "frontend": "http://frontend:3000",
    }

    url = target_map.get(dest_service)
    if url:
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                start = time.time()
                resp = await client.get(url)
                packet.latency_ms = round((time.time() - start) * 1000, 2)
                packet.status = "delivered" if resp.status_code < 400 else "error"
            except Exception:
                packet.latency_ms = -1
                packet.status = "timeout"
    elif dest_service == "database":
        try:
            start = time.time()
            async with db_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            packet.latency_ms = round((time.time() - start) * 1000, 2)
            packet.status = "delivered"
        except Exception:
            packet.latency_ms = -1
            packet.status = "timeout"
    else:
        packet.status = "delivered"
        packet.latency_ms = 1.0

    result = await packet_monitor.record_packet(db_pool, packet)
    return result.model_dump()


def _resolve_service(dest: str) -> str:
    lower = dest.lower()
    if "gateway" in lower or "gate" in lower or "nginx" in lower:
        return "gateway"
    if "api" in lower or "hall" in lower or "fastapi" in lower:
        return "api"
    if "database" in lower or "db" in lower or "postgres" in lower or "archive" in lower:
        return "database"
    if "frontend" in lower or "browser" in lower or "command" in lower:
        return "frontend"
    return "gateway"


# --- Port info ---

@app.get("/api/ports/{service}")
async def port_info(service: str) -> dict:
    port = city_state.get_service_port(service)
    if port is None:
        raise HTTPException(status_code=404, detail=f"Unknown service: {service}")
    buildings = city_state.get_buildings()
    building = next((b for b in buildings if b.service == service), None)
    conns = [c.model_dump() for c in city_state.get_connections()
             if c.source == service or c.destination == service]
    return {
        "service": service,
        "port": port,
        "building": building.name if building else service,
        "networks": building.networks if building else [],
        "protocol": "TCP",
        "description": f"Port {port} is used by {service} for incoming connections",
        "connections": conns,
    }


# --- Firewall ---

class FirewallToggleRequest(BaseModel):
    enabled: bool


@app.post("/api/firewall/toggle")
async def toggle_firewall(req: FirewallToggleRequest):
    result = city_state.toggle_firewall(req.enabled)
    return {"enabled": result, "rules": [r.model_dump() for r in city_state.get_firewall_rules()]}


@app.post("/api/firewall/rules")
async def add_firewall_rule(rule: FirewallRule | FirewallToggleRequest):
    if isinstance(rule, FirewallToggleRequest):
        result = city_state.toggle_firewall(rule.enabled)
        return {"enabled": result, "rules": [r.model_dump() for r in city_state.get_firewall_rules()]}
    return city_state.set_firewall_rule(rule).model_dump()


@app.get("/api/firewall/rules")
async def list_firewall_rules():
    return [r.model_dump() for r in city_state.get_firewall_rules()]


# --- DNS ---

@app.get("/api/dns/resolve/{name}")
async def dns_resolve(name: str) -> list[dict]:
    steps = dns_simulator.simulate_dns_resolution(name)
    return [s.model_dump() for s in steps]


# --- Challenges ---

@app.get("/api/challenges")
async def list_challenges() -> list[dict]:
    return challenge_engine.get_challenges()


@app.post("/api/challenges/{challenge_id}/check")
async def check_challenge(challenge_id: str, submission: ChallengeSubmission):
    try:
        cid = int(challenge_id)
    except ValueError:
        cid_map = {"wrong-port": 1, "invasion": 2, "dns-down": 3, "protocol-race": 4}
        cid = cid_map.get(challenge_id, 0)

    answer = submission.answer
    if isinstance(answer, str):
        answer = {"value": answer}
    elif not isinstance(answer, dict):
        answer = {"value": str(answer)}

    result = challenge_engine.check_answer(cid, answer)
    return result.model_dump()


# --- TLS Handshake ---

@app.get("/api/tls/handshake")
async def tls_handshake():
    steps = [
        TLSStep(
            step_number=1,
            name="Client Hello",
            description="Client sends supported TLS versions, cipher suites, and a random number",
            data={
                "tls_version": "TLS 1.3",
                "cipher_suites": ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
                "client_random": "a1b2c3d4e5f6....(32 bytes)",
            },
        ),
        TLSStep(
            step_number=2,
            name="Server Hello",
            description="Server selects TLS version, cipher suite, and sends its random number",
            data={
                "tls_version": "TLS 1.3",
                "selected_cipher": "TLS_AES_256_GCM_SHA384",
                "server_random": "f6e5d4c3b2a1....(32 bytes)",
            },
        ),
        TLSStep(
            step_number=3,
            name="Certificate",
            description="Server sends its X.509 certificate chain for identity verification",
            data={
                "subject": "CN=portquest.local",
                "issuer": "CN=Port Quest CA",
                "public_key": "RSA 2048-bit",
            },
        ),
        TLSStep(
            step_number=4,
            name="Certificate Verify",
            description="Server proves it owns the private key by signing a transcript hash",
            data={
                "signature_algorithm": "RSA-PSS-SHA256",
                "verified": True,
            },
        ),
        TLSStep(
            step_number=5,
            name="Key Derivation",
            description="Both sides derive the same session keys using ECDHE shared secret",
            data={
                "algorithm": "HKDF-SHA384",
                "derived_keys": ["client_write_key", "server_write_key"],
            },
        ),
        TLSStep(
            step_number=6,
            name="Finished",
            description="Both sides confirm the handshake with a MAC over the transcript",
            data={
                "status": "Secure channel established!",
                "total_roundtrips": "1-RTT (TLS 1.3)",
            },
        ),
    ]
    return {"steps": [s.model_dump() for s in steps]}
