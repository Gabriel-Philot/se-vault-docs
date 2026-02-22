"""
Prática 02 — Redis Patterns para Dados
=======================================

Objetivo: ver Redis sendo usado para 4 padrões comuns além de
cache simples (que já vimos na aula 04).

Padrões:
  1. Cache com TTL e invalidação
  2. Rate limiting por IP
  3. Feature store (ML)
  4. Contador/Leaderboard com sorted sets

Execução:
  docker compose up --build

Endpoints:
  http://localhost:8000/docs  → Swagger UI
"""

import json
import os
import random
import time
from contextlib import asynccontextmanager
from datetime import datetime

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request

# ---------------------------------------------------------------------------
# Redis connection
# ---------------------------------------------------------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r: aioredis.Redis = None  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    global r
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    # Seed dados de exemplo
    await _seed_data()
    yield
    await r.aclose()


app = FastAPI(title="Practice 02 — Redis Patterns", lifespan=lifespan)


# ===========================================================================
# PADRÃO 1: Cache com TTL
# ===========================================================================

# Simula um "banco de dados" lento
FAKE_DB = {
    "products": [
        {"id": 1, "name": "Notebook", "price": 4500.00},
        {"id": 2, "name": "Mouse", "price": 89.90},
        {"id": 3, "name": "Teclado", "price": 199.90},
        {"id": 4, "name": "Monitor", "price": 1899.00},
        {"id": 5, "name": "Headset", "price": 349.90},
    ]
}


@app.get("/products")
async def list_products():
    """
    Cache-aside pattern:
    1. Tenta Redis primeiro
    2. Se não tem (miss), "consulta o banco" e salva no cache
    """
    cache_key = "cache:products"

    # 1. Tenta o cache
    cached = await r.get(cache_key)
    if cached:
        return {
            "source": "redis_cache",
            "ttl_remaining": await r.ttl(cache_key),
            "data": json.loads(cached),
        }

    # 2. Cache miss — simula latência do banco
    time.sleep(0.5)  # 500ms de "query"
    data = FAKE_DB["products"]

    # 3. Salva no cache com TTL de 30 segundos
    await r.setex(cache_key, 30, json.dumps(data))

    return {
        "source": "database_slow",
        "ttl_remaining": 30,
        "data": data,
    }


@app.delete("/products/cache")
async def invalidate_products_cache():
    """Invalida o cache manualmente — simula um write no banco."""
    deleted = await r.delete("cache:products")
    return {
        "invalidated": bool(deleted),
        "message": "Próximo GET vai ao 'banco' de novo",
    }


# ===========================================================================
# PADRÃO 2: Rate Limiting
# ===========================================================================


@app.get("/limited")
async def rate_limited_endpoint(request: Request):
    """
    Rate limit: máximo 5 requests por minuto por IP.
    Usa INCR + EXPIRE no Redis.
    """
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"rate:{client_ip}"

    current = await r.incr(rate_key)
    if current == 1:
        await r.expire(rate_key, 60)

    ttl = await r.ttl(rate_key)

    if current > 5:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": "5 requests/minute",
                "retry_after_seconds": ttl,
                "requests_made": current,
            },
        )

    return {
        "message": "OK",
        "requests_used": current,
        "requests_remaining": 5 - current,
        "window_resets_in": ttl,
    }


# ===========================================================================
# PADRÃO 3: Feature Store (ML)
# ===========================================================================


async def _seed_data():
    """Simula um pipeline batch que pré-computa features de usuários."""
    users = [
        {"user_id": 1, "name": "Alice", "ticket_medio": 234.50, "total_compras": 47, "days_since_last": 3},
        {"user_id": 2, "name": "Bob", "ticket_medio": 89.90, "total_compras": 12, "days_since_last": 15},
        {"user_id": 3, "name": "Carol", "ticket_medio": 567.00, "total_compras": 89, "days_since_last": 1},
        {"user_id": 4, "name": "Dave", "ticket_medio": 45.00, "total_compras": 3, "days_since_last": 45},
    ]
    for u in users:
        uid = u["user_id"]
        await r.hset(f"features:{uid}", mapping={
            "ticket_medio": str(u["ticket_medio"]),
            "total_compras": str(u["total_compras"]),
            "days_since_last": str(u["days_since_last"]),
            "computed_at": datetime.now().isoformat(),
        })


@app.get("/features/{user_id}")
async def get_user_features(user_id: int):
    """
    Lê features pré-computadas do Redis (simula feature store).
    Em produção: pipeline batch (Airflow) computa → salva no Redis.
    API de predição lê do Redis em <1ms.
    """
    features = await r.hgetall(f"features:{user_id}")
    if not features:
        raise HTTPException(404, detail=f"Features não encontradas para user {user_id}")

    return {
        "user_id": user_id,
        "features": features,
        "source": "redis_feature_store",
        "latency_note": "< 1ms (vs ~200ms se calculasse on-the-fly)",
    }


@app.post("/predict/{user_id}")
async def predict_churn(user_id: int):
    """
    Simula API de predição que usa features do Redis.
    Modelo fake: churn = days_since_last > 30 AND total_compras < 10
    """
    features = await r.hgetall(f"features:{user_id}")
    if not features:
        raise HTTPException(404, detail=f"Features não encontradas para user {user_id}")

    days = int(features["days_since_last"])
    compras = int(features["total_compras"])

    # "Modelo" simplificado
    churn_score = min(1.0, (days / 60) * (1 - compras / 100))
    will_churn = churn_score > 0.5

    return {
        "user_id": user_id,
        "churn_score": round(churn_score, 3),
        "will_churn": will_churn,
        "features_used": features,
        "model": "fake_rule_based_v1",
    }


# ===========================================================================
# PADRÃO 4: Contador / Leaderboard (Sorted Set)
# ===========================================================================


@app.post("/events/{event_name}")
async def track_event(event_name: str):
    """
    Incrementa contador de evento.
    Usa sorted set — score é a contagem, member é o evento.
    """
    count = await r.zincrby("leaderboard:events", 1, event_name)
    return {
        "event": event_name,
        "total_count": int(count),
    }


@app.get("/leaderboard")
async def get_leaderboard():
    """
    Top 10 eventos mais frequentes.
    Sorted set retorna ordenado por score (desc).
    """
    top = await r.zrevrange("leaderboard:events", 0, 9, withscores=True)
    return {
        "leaderboard": [
            {"event": name, "count": int(score)}
            for name, score in top
        ],
    }


# ===========================================================================
# DEBUG: ver estado do Redis
# ===========================================================================


@app.get("/debug/keys")
async def debug_keys():
    """Lista todas as chaves no Redis — útil para debug."""
    keys = await r.keys("*")
    result = {}
    for key in sorted(keys):
        key_type = await r.type(key)
        ttl = await r.ttl(key)
        result[key] = {"type": key_type, "ttl": ttl}
    return result
