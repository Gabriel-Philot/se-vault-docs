import json
import time
import sys

import polars as pl
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

sys.path.insert(0, "/app")
from tracker import RaceTracker

app = FastAPI()
DATA_PATH = "/data/dataset.csv"


@app.get("/health")
def health():
    return {"status": "ready"}


@app.post("/run")
async def run():
    async def generate():
        tracker = RaceTracker()
        tracker.start_race()

        # Stage 1: Scan CSV, filter, and collect with polars
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(1))}\n\n"

        filtered = (
            pl.scan_csv(DATA_PATH)
            .filter((pl.col("active") == True) & (pl.col("salary") > 50000))  # noqa: E712
            .collect()
        )

        yield f"data: {json.dumps(tracker.stage_complete(1, t))}\n\n"

        # Stage 2: Group by department and aggregate
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(2))}\n\n"

        dept_stats = filtered.group_by("department").agg(
            pl.col("salary").count().alias("count"),
            pl.col("salary").mean().alias("avg_salary"),
            pl.col("salary").max().alias("max_salary"),
            pl.col("salary").min().alias("min_salary"),
            pl.col("rating").mean().alias("avg_rating"),
        )

        yield f"data: {json.dumps(tracker.stage_complete(2, t))}\n\n"

        # Stage 3: Join filtered with dept stats and sort
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(3))}\n\n"

        result = (
            filtered.join(
                dept_stats.select("department", "avg_salary", "avg_rating"),
                on="department",
                suffix="_dept",
            )
            .sort("salary", descending=True)
        )
        _ = result.shape[0]

        yield f"data: {json.dumps(tracker.stage_complete(3, t))}\n\n"
        yield f"data: {json.dumps(tracker.finish())}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
