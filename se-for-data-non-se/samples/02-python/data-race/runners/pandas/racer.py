import json
import time
import sys

import pandas as pd
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

        # Stage 1: Read CSV and filter with pandas
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(1))}\n\n"

        df = pd.read_csv(DATA_PATH)
        filtered = df[(df["active"] == True) & (df["salary"] > 50000)]  # noqa: E712

        yield f"data: {json.dumps(tracker.stage_complete(1, t))}\n\n"

        # Stage 2: Group by department and aggregate
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(2))}\n\n"

        dept_stats = filtered.groupby("department").agg(
            count=("salary", "count"),
            avg_salary=("salary", "mean"),
            max_salary=("salary", "max"),
            min_salary=("salary", "min"),
            avg_rating=("rating", "mean"),
        ).reset_index()

        yield f"data: {json.dumps(tracker.stage_complete(2, t))}\n\n"

        # Stage 3: Merge filtered with dept stats and sort
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(3))}\n\n"

        merged = filtered.merge(dept_stats[["department", "avg_salary", "avg_rating"]], on="department", suffixes=("", "_dept"))
        result = merged.sort_values("salary", ascending=False)
        _ = len(result)

        yield f"data: {json.dumps(tracker.stage_complete(3, t))}\n\n"
        yield f"data: {json.dumps(tracker.finish())}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
