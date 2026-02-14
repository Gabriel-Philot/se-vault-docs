from __future__ import annotations

import random

from models import DNSStep

DOCKER_SERVICES = {
    "frontend": "172.20.0.2",
    "gateway": "172.20.0.3",
    "api": "172.21.0.2",
    "database": "172.21.0.3",
}


def simulate_dns_resolution(name: str) -> list[DNSStep]:
    resolved_ip = DOCKER_SERVICES.get(name, f"172.21.0.{random.randint(10, 99)}")
    is_docker_service = name in DOCKER_SERVICES

    steps = [
        DNSStep(
            step_number=1,
            description="Browser checks its local DNS cache",
            server="browser-cache",
            query=name,
            response="MISS - not found in browser cache",
            latency_ms=round(random.uniform(0.1, 0.5), 2),
        ),
        DNSStep(
            step_number=2,
            description="OS checks the system DNS cache (/etc/hosts)",
            server="os-cache",
            query=name,
            response="MISS - not in /etc/hosts",
            latency_ms=round(random.uniform(0.2, 1.0), 2),
        ),
    ]

    if is_docker_service:
        steps.append(
            DNSStep(
                step_number=3,
                description="Docker's embedded DNS server (127.0.0.11) resolves container names",
                server="docker-dns (127.0.0.11)",
                query=name,
                response=f"HIT - {name} -> {resolved_ip} (Docker internal network)",
                latency_ms=round(random.uniform(0.5, 2.0), 2),
            )
        )
        steps.append(
            DNSStep(
                step_number=4,
                description="IP address returned to the requesting service",
                server="docker-dns",
                query=name,
                response=f"RESOLVED: {resolved_ip}",
                latency_ms=round(random.uniform(0.1, 0.3), 2),
            )
        )
    else:
        steps.extend([
            DNSStep(
                step_number=3,
                description="Docker DNS cannot resolve - forwarding to recursive resolver",
                server="docker-dns (127.0.0.11)",
                query=name,
                response="MISS - not a Docker service, forwarding upstream",
                latency_ms=round(random.uniform(1.0, 3.0), 2),
            ),
            DNSStep(
                step_number=4,
                description="Recursive resolver queries root DNS server",
                server="root-server (a.root-servers.net)",
                query=f"{name}.",
                response=f"REFERRAL -> .{name.split('.')[-1] if '.' in name else 'com'}. TLD servers",
                latency_ms=round(random.uniform(10, 30), 2),
            ),
            DNSStep(
                step_number=5,
                description="Recursive resolver queries TLD server",
                server=f"tld-server (.{name.split('.')[-1] if '.' in name else 'com'})",
                query=name,
                response=f"REFERRAL -> authoritative NS for {name}",
                latency_ms=round(random.uniform(15, 40), 2),
            ),
            DNSStep(
                step_number=6,
                description="Recursive resolver queries authoritative name server",
                server=f"ns1.{name.split('.')[-1] if '.' in name else name}.dns",
                query=name,
                response=f"A RECORD: {resolved_ip}",
                latency_ms=round(random.uniform(5, 20), 2),
            ),
            DNSStep(
                step_number=7,
                description="IP address returned through the chain back to the client",
                server="recursive-resolver",
                query=name,
                response=f"RESOLVED: {resolved_ip} (TTL: 3600s)",
                latency_ms=round(random.uniform(0.5, 2.0), 2),
            ),
        ])

    return steps
