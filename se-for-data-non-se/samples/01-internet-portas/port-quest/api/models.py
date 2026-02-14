from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ConnectionState(str, Enum):
    LISTEN = "LISTEN"
    ESTABLISHED = "ESTABLISHED"
    TIME_WAIT = "TIME_WAIT"
    CLOSE_WAIT = "CLOSE_WAIT"
    CLOSED = "CLOSED"


class FirewallAction(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    DENY = "DENY"


class Connection(BaseModel):
    id: str = ""
    source: str
    source_port: int = 0
    destination: str
    destination_port: int = 0
    port: int = 0
    state: ConnectionState = ConnectionState.LISTEN
    protocol: str = "TCP"


class Building(BaseModel):
    id: str = ""
    name: str
    service: str
    port: int
    status: str = "running"
    networks: list[str] = []
    description: str = ""
    connections: list[Connection] = []


class Packet(BaseModel):
    id: str | int | None = None
    source: str
    source_port: int = 0
    destination: str
    destination_port: int = 0
    port: int = 0
    protocol: str = "HTTP"
    payload: str | None = None
    payload_preview: str = ""
    latency_ms: float = 0
    status: str = "traveling"
    timestamp: str | None = None


class FirewallRule(BaseModel):
    id: str = ""
    source: str = "*"
    destination: str = "*"
    port: int = 0
    action: str = "BLOCK"
    enabled: bool = True


class DNSStep(BaseModel):
    step_number: int
    description: str
    server: str
    query: str
    response: str
    latency_ms: float


class TLSStep(BaseModel):
    step_number: int
    name: str
    description: str
    data: dict[str, Any] = {}


class ChallengeSubmission(BaseModel):
    challenge_id: str | int | None = None
    answer: Any = None


class ChallengeResult(BaseModel):
    correct: bool
    message: str = ""
    explanation: str = ""
    score: int = 0


class CityStatus(BaseModel):
    buildings: list[Building] = []
    connections: list[Connection] = []
    active_connections: int = 0
    packets_per_second: float = 0
    firewall_enabled: bool = False
    tls_enabled: bool = False
