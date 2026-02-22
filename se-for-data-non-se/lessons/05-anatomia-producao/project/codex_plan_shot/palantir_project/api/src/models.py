from typing import Literal

from pydantic import BaseModel, Field


MissionStatus = Literal["PENDING", "STARTED", "PROCESSING", "RETRY", "SUCCESS", "FAILURE"]


class ApiMeta(BaseModel):
    timestamp: str
    source: str | None = None


class ApiEnvelope(BaseModel):
    data: dict
    meta: ApiMeta


class MissionSummary(BaseModel):
    id: str
    mission_type: Literal["recon", "consult", "raven"]
    status: MissionStatus
    progress_pct: int = Field(ge=0, le=100)
