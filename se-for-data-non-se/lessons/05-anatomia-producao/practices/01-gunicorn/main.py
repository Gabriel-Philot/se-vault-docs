"""
Prática 01 — Web Server vs App Server
======================================

Objetivo: ver na prática a diferença entre rodar Uvicorn direto
vs Gunicorn com workers Uvicorn, e Nginx na frente de tudo.

Execução:
  docker compose up --build

Depois abra:
  http://localhost        → Nginx proxy → Gunicorn
  http://localhost:8000   → Gunicorn direto (bypass Nginx)

Teste:
  curl http://localhost/
  curl http://localhost/workers
  curl http://localhost/slow
"""

import os
import time

from fastapi import FastAPI

app = FastAPI(title="Practice 01 — Gunicorn")


@app.get("/")
async def root():
    """Retorna info do worker que processou o request."""
    return {
        "message": "Hello from production!",
        "worker_pid": os.getpid(),
        "parent_pid": os.getppid(),
    }


@app.get("/workers")
async def workers_info():
    """Mostra detalhes do processo — útil para ver load balancing entre workers."""
    return {
        "worker_pid": os.getpid(),
        "parent_pid": os.getppid(),
        "explanation": (
            "Faça múltiplos requests a este endpoint. "
            "O worker_pid vai alternar entre os workers do Gunicorn. "
            "O parent_pid é sempre o mesmo (processo master do Gunicorn)."
        ),
    }


@app.get("/slow")
async def slow_endpoint():
    """
    Simula uma operação lenta (2s).
    Útil para testar: com múltiplos workers, outros requests
    continuam sendo atendidos enquanto este trava.
    """
    time.sleep(2)
    return {
        "message": "Demorei 2 segundos",
        "worker_pid": os.getpid(),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
