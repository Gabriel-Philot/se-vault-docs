"""
Tasks Celery — rodam nos workers, NÃO na API.

Cada task é uma função Python que o Celery pega da fila e executa
em um processo separado.
"""

import os
import random
import time

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Config do Celery
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,           # Permite ver status STARTED
    result_expires=300,                # Resultados expiram em 5 min
    task_acks_late=True,               # ACK só depois de processar (resiliência)
    worker_prefetch_multiplier=1,      # Pega 1 task por vez (fair scheduling)
)


@celery_app.task(bind=True, max_retries=3)
def process_csv(self, filename: str, num_rows: int):
    """
    Simula processamento de um CSV grande.
    bind=True dá acesso ao self (para retries, status updates).
    """
    try:
        # Simula leitura e processamento
        self.update_state(state="PROCESSING", meta={"step": "reading", "progress": 0})
        time.sleep(2)

        self.update_state(state="PROCESSING", meta={"step": "transforming", "progress": 50})
        time.sleep(2)

        self.update_state(state="PROCESSING", meta={"step": "saving", "progress": 90})
        time.sleep(1)

        # Simula falha aleatória (20% chance) para demonstrar retry
        if random.random() < 0.2:
            raise ValueError("Erro simulado no processamento")

        return {
            "filename": filename,
            "rows_processed": num_rows,
            "output": f"/data/processed/{filename}",
            "status": "completed",
        }
    except ValueError as exc:
        # Retry com backoff exponencial: 2s, 4s, 8s
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)


@celery_app.task
def aggregate_sales(region: str, month: str):
    """
    Simula uma agregação pesada que não cabe num request HTTP.
    Ex: calcular métricas por região para dashboard.
    """
    time.sleep(3)  # Simula query complexa

    # Resultado fake
    return {
        "region": region,
        "month": month,
        "total_sales": round(random.uniform(10000, 500000), 2),
        "num_transactions": random.randint(100, 5000),
        "avg_ticket": round(random.uniform(50, 500), 2),
    }


@celery_app.task
def send_report(email: str, report_type: str):
    """
    Simula envio de relatório por email.
    Operação que não precisa de resposta imediata.
    """
    time.sleep(2)  # Simula geração + envio

    return {
        "email": email,
        "report_type": report_type,
        "sent": True,
        "message": f"Relatório '{report_type}' enviado para {email}",
    }
