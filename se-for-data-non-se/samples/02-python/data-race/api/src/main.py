from __future__ import annotations

import csv
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from src.models import DatasetInfo, RaceState, RaceStatus
from src.services.race_manager import RaceManager
from src.services.dataset_generator import (
    generate_dataset_stream,
    is_generating,
    dataset_exists,
)

DATA_PATH = os.getenv("DATA_PATH", "/data/dataset.csv")

race_manager = RaceManager()
_dataset_info: DatasetInfo | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(title="Race Control", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/race/status")
async def race_status() -> RaceStatus:
    return RaceStatus(state=race_manager.get_state(), results=race_manager.get_results())


@app.post("/api/race/start")
async def race_start() -> StreamingResponse:
    if race_manager.get_state() == RaceState.RUNNING:
        raise HTTPException(status_code=409, detail="Race already in progress")
    return StreamingResponse(
        race_manager.start_race(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/race/results")
async def race_results() -> list | None:
    return race_manager.get_results()


@app.get("/api/runners/health")
async def runners_health() -> dict[str, str]:
    return await race_manager.check_runners_health()


@app.get("/api/dataset/info")
async def dataset_info() -> DatasetInfo:
    global _dataset_info

    if not dataset_exists():
        raise HTTPException(status_code=404, detail="Dataset not generated yet")

    if _dataset_info is not None:
        return _dataset_info

    size_mb = os.path.getsize(DATA_PATH) / (1024 * 1024)
    with open(DATA_PATH, newline="") as f:
        reader = csv.reader(f)
        columns = next(reader)
        rows = sum(1 for _ in reader)

    _dataset_info = DatasetInfo(rows=rows, columns=columns, size_mb=round(size_mb, 2))
    return _dataset_info


@app.post("/api/dataset/generate")
async def dataset_generate() -> StreamingResponse:
    if is_generating():
        raise HTTPException(status_code=409, detail="Dataset generation already in progress")
    if race_manager.get_state() == RaceState.RUNNING:
        raise HTTPException(status_code=409, detail="Cannot generate dataset during a race")

    global _dataset_info
    _dataset_info = None  # invalidate cache so next info call re-reads

    return StreamingResponse(
        generate_dataset_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
