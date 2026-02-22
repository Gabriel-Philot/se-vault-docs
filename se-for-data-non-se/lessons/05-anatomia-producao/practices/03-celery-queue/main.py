"""
Prática 03 — Filas com Celery
==============================

Objetivo: ver o padrão assíncrono na prática:
  1. API recebe request → enfileira task → retorna task_id (rápido)
  2. Worker pega task da fila → processa → salva resultado
  3. API pode checar status da task a qualquer momento

Execução:
  docker compose up --build

Endpoints:
  http://localhost:8000/docs  → Swagger UI
"""

from celery.result import AsyncResult
from fastapi import FastAPI

from tasks import aggregate_sales, celery_app, process_csv, send_report

app = FastAPI(title="Practice 03 — Celery Queue")


# ===========================================================================
# Enfileirar tasks
# ===========================================================================


@app.post("/process-csv")
async def enqueue_csv(filename: str = "vendas_2025.csv", num_rows: int = 100_000):
    """
    Enfileira processamento de CSV.
    Retorna imediatamente com task_id (não espera processar).
    """
    task = process_csv.delay(filename, num_rows)
    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Task enfileirada. Use GET /tasks/{task_id} para acompanhar.",
    }


@app.post("/aggregate")
async def enqueue_aggregation(region: str = "sudeste", month: str = "2025-01"):
    """Enfileira agregação de vendas por região."""
    task = aggregate_sales.delay(region, month)
    return {
        "task_id": task.id,
        "status": "queued",
    }


@app.post("/send-report")
async def enqueue_report(email: str = "analista@empresa.com", report_type: str = "vendas_mensal"):
    """Enfileira envio de relatório."""
    task = send_report.delay(email, report_type)
    return {
        "task_id": task.id,
        "status": "queued",
    }


# ===========================================================================
# Checar status
# ===========================================================================


@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Checa o status de qualquer task.

    Status possíveis:
    - PENDING:    na fila, ainda não pegou
    - STARTED:    worker pegou, está executando
    - PROCESSING: custom state (nosso, com progresso)
    - SUCCESS:    terminou com sucesso
    - FAILURE:    falhou (ver error)
    - RETRY:      falhou, vai tentar de novo
    """
    result = AsyncResult(task_id, app=celery_app)

    response = {
        "task_id": task_id,
        "status": result.status,
    }

    if result.status == "PROCESSING":
        response["progress"] = result.info
    elif result.status == "SUCCESS":
        response["result"] = result.result
    elif result.status == "FAILURE":
        response["error"] = str(result.result)

    return response


# ===========================================================================
# Monitoramento
# ===========================================================================


@app.get("/queue/stats")
async def queue_stats():
    """
    Estatísticas da fila — quantas tasks pendentes, workers ativos.
    """
    inspect = celery_app.control.inspect()

    active = inspect.active() or {}
    reserved = inspect.reserved() or {}

    workers = {}
    for worker_name, tasks in active.items():
        workers[worker_name] = {
            "active_tasks": len(tasks),
            "reserved_tasks": len(reserved.get(worker_name, [])),
        }

    return {
        "workers": workers,
        "total_workers": len(workers),
    }
