from __future__ import annotations

import json
from typing import Any

import asyncpg

from models import ChallengeResult


_challenges: dict[int, dict[str, Any]] = {}

CHALLENGE_SCORES = {1: 10, 2: 20, 3: 20, 4: 30}


async def load_challenges(pool: asyncpg.Pool) -> None:
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, name, description, difficulty, correct_answer, hints FROM challenges")
            for row in rows:
                _challenges[row["id"]] = {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "difficulty": row["difficulty"],
                    "correct_answer": json.loads(row["correct_answer"]) if isinstance(row["correct_answer"], str) else row["correct_answer"],
                    "hints": json.loads(row["hints"]) if isinstance(row["hints"], str) else row["hints"],
                }
    except Exception:
        _challenges[1] = {
            "id": 1, "name": "Wrong Port",
            "description": "A service is running on the wrong port.",
            "difficulty": "easy",
            "correct_answer": {"service": "api", "wrong_port": "9000", "correct_port": "8000", "value": "8000"},
            "hints": ["Check which ports each service should be listening on"],
        }
        _challenges[2] = {
            "id": 2, "name": "The Invasion",
            "description": "External packets are trying to access the database directly.",
            "difficulty": "medium",
            "correct_answer": {"action": "block", "target": "database", "value": "block-external-5432"},
            "hints": ["The Municipal Archive should only be accessible from city-internal"],
        }
        _challenges[3] = {
            "id": 3, "name": "DNS Down",
            "description": "DNS resolution has failed.",
            "difficulty": "medium",
            "correct_answer": {"resolution": "docker-dns", "value": "3"},
            "hints": ["Docker has its own DNS server"],
        }
        _challenges[4] = {
            "id": 4, "name": "Protocol Race",
            "description": "Compare REST vs gRPC.",
            "difficulty": "hard",
            "correct_answer": {"faster": "grpc", "value": "gRPC"},
            "hints": ["Look at the payload sizes"],
        }


def get_challenges() -> list[dict[str, Any]]:
    return [
        {"id": c["id"], "name": c["name"], "description": c["description"], "difficulty": c["difficulty"], "hints": c["hints"]}
        for c in _challenges.values()
    ]


def check_answer(challenge_id: int, answer: dict[str, Any]) -> ChallengeResult:
    challenge = _challenges.get(challenge_id)
    if challenge is None:
        return ChallengeResult(correct=False, message="Challenge not found", explanation="No challenge with that ID exists.", score=0)

    correct_answer = challenge["correct_answer"]

    is_correct = False
    answer_value = answer.get("value", "")

    if challenge_id == 1:
        is_correct = str(answer_value) == "8000"
    elif challenge_id == 2:
        is_correct = str(answer_value).lower() in ("block-external-5432", "allow-internal-5432")
    elif challenge_id == 3:
        is_correct = str(answer_value) in ("3", "docker-dns")
    elif challenge_id == 4:
        is_correct = str(answer_value).lower() == "grpc"
    else:
        is_correct = all(
            str(answer.get(k, "")).lower() == str(v).lower()
            for k, v in correct_answer.items()
        )

    explanations = {
        1: "Port 8000 is the standard port for the FastAPI service (City Hall). If it were running on 9000, the gateway's reverse proxy config wouldn't be able to reach it since nginx proxies to api:8000.",
        2: "The database (Municipal Archive) sits on city-internal network only. Direct external access should be blocked - traffic must flow through the gateway (City Gate) which bridges both networks, demonstrating the NAT Gateway concept.",
        3: "Docker has an embedded DNS server at 127.0.0.11. Containers resolve service names (like 'api' or 'database') through Docker DNS. If DNS fails, you can fall back to direct container IPs, but that's fragile since IPs can change.",
        4: "gRPC uses Protocol Buffers for binary serialization, which produces smaller payloads and is faster to serialize/deserialize compared to JSON used by REST. This matters especially for high-throughput service-to-service communication.",
    }

    score = CHALLENGE_SCORES.get(challenge_id, 10) if is_correct else 0

    if is_correct:
        return ChallengeResult(
            correct=True,
            message=f"Correct! You solved '{challenge['name']}'!",
            explanation=explanations.get(challenge_id, "Well done!"),
            score=score,
        )

    return ChallengeResult(
        correct=False,
        message="Not quite right. Try again!",
        explanation=f"Hint: {challenge['hints'][0] if challenge['hints'] else 'Think about the network topology.'}",
        score=0,
    )
