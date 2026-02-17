from __future__ import annotations

from models import Building, Connection, ConnectionState, CityStatus, FirewallRule


BUILDINGS: list[Building] = [
    Building(
        id="1",
        name="Command Center",
        service="frontend",
        port=3000,
        status="running",
        networks=["city-public"],
        description="React frontend served by Vite dev server",
        connections=[],
    ),
    Building(
        id="2",
        name="City Gate",
        service="gateway",
        port=80,
        status="running",
        networks=["city-public", "city-internal"],
        description="Nginx reverse proxy - the entry point to the city",
        connections=[],
    ),
    Building(
        id="3",
        name="City Hall",
        service="api",
        port=8000,
        status="running",
        networks=["city-internal"],
        description="FastAPI application server handling business logic",
        connections=[],
    ),
    Building(
        id="4",
        name="Municipal Archive",
        service="database",
        port=5432,
        status="running",
        networks=["city-internal"],
        description="PostgreSQL database - the city's permanent records",
        connections=[],
    ),
]

SERVICE_PORT_MAP: dict[str, int] = {
    "frontend": 3000,
    "gateway": 80,
    "api": 8000,
    "database": 5432,
}

_connections: list[Connection] = [
    Connection(
        id="conn-1",
        source="frontend",
        source_port=3000,
        destination="gateway",
        destination_port=80,
        port=80,
        protocol="HTTP",
        state=ConnectionState.ESTABLISHED,
    ),
    Connection(
        id="conn-2",
        source="gateway",
        source_port=80,
        destination="api",
        destination_port=8000,
        port=8000,
        protocol="HTTP",
        state=ConnectionState.ESTABLISHED,
    ),
    Connection(
        id="conn-3",
        source="api",
        source_port=8000,
        destination="database",
        destination_port=5432,
        port=5432,
        protocol="TCP",
        state=ConnectionState.ESTABLISHED,
    ),
]

_firewall_rules: dict[str, FirewallRule] = {}
_firewall_enabled: bool = False
_tls_enabled: bool = False


def get_buildings() -> list[Building]:
    blds = []
    for b in BUILDINGS:
        conns = [c for c in _connections if c.source == b.service or c.destination == b.service]
        blds.append(b.model_copy(update={"connections": conns}))
    return blds


def get_connections() -> list[Connection]:
    return _connections


def get_city_status(packets_per_second: float = 0.0) -> CityStatus:
    active = sum(1 for c in _connections if c.state == ConnectionState.ESTABLISHED)
    return CityStatus(
        buildings=get_buildings(),
        connections=_connections,
        packets_per_second=packets_per_second,
        active_connections=active,
        firewall_enabled=_firewall_enabled,
        tls_enabled=_tls_enabled,
    )


def get_service_port(service: str) -> int | None:
    return SERVICE_PORT_MAP.get(service)


def get_firewall_rules() -> list[FirewallRule]:
    return list(_firewall_rules.values())


def set_firewall_rule(rule: FirewallRule) -> FirewallRule:
    key = f"{rule.source}->{rule.destination}:{rule.port}"
    if not rule.id:
        rule.id = key
    _firewall_rules[key] = rule
    return rule


def toggle_firewall(enabled: bool) -> bool:
    global _firewall_enabled
    _firewall_enabled = enabled
    if enabled:
        set_firewall_rule(FirewallRule(
            id="default-block-db",
            source="*",
            destination="database",
            port=5432,
            action="BLOCK",
            enabled=True,
        ))
    else:
        _firewall_rules.clear()
    return _firewall_enabled


def toggle_tls(enabled: bool) -> bool:
    global _tls_enabled
    _tls_enabled = enabled
    return _tls_enabled


def check_firewall(source: str, destination: str, port: int) -> bool:
    """Returns True if traffic is allowed, False if blocked."""
    if not _firewall_enabled:
        return True
    for rule in _firewall_rules.values():
        if not rule.enabled:
            continue
        src_match = rule.source == "*" or rule.source == source
        dst_match = rule.destination == "*" or rule.destination == destination
        port_match = rule.port == 0 or rule.port == port
        if src_match and dst_match and port_match:
            return rule.action.upper() == "ALLOW"
    return True
