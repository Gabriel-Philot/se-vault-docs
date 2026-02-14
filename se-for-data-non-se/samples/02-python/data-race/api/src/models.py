from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class RunnerEvent(BaseModel):
    event: str
    stage: Optional[int] = None
    status: Optional[str] = None
    memory_mb: Optional[float] = None
    elapsed_ms: Optional[float] = None
    total_ms: Optional[float] = None
    peak_memory_mb: Optional[float] = None


class RunnerInfo(BaseModel):
    name: str
    color: str
    url: str


class RaceState(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    FINISHED = "finished"


class RaceResult(BaseModel):
    runner: str
    total_ms: float
    peak_memory_mb: float
    stage_times: list[float]


class RaceStatus(BaseModel):
    state: RaceState
    results: Optional[list[RaceResult]] = None


class DatasetInfo(BaseModel):
    rows: int
    columns: list[str]
    size_mb: float
