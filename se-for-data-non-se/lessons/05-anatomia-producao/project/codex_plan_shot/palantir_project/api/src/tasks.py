from celery import Celery

from .config import settings


celery_app = Celery(
    "palantir",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)


@celery_app.task(bind=True, name="palantir.missions.echo")
def echo_task(self, mission_type: str = "recon") -> dict:
    return {"mission_type": mission_type, "status": "SUCCESS", "message": "Scaffold task executed"}
