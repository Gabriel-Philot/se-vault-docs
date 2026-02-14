import csv
import json
import time
import sys
from collections import defaultdict

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

        # Stage 1: Read CSV and filter rows manually
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(1))}\n\n"

        filtered = []
        with open(DATA_PATH, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["active"] == "True" and float(row["salary"]) > 50000:
                    row["salary"] = float(row["salary"])
                    row["rating"] = float(row["rating"])
                    filtered.append(row)

        yield f"data: {json.dumps(tracker.stage_complete(1, t))}\n\n"

        # Stage 2: Group by department and compute aggregates
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(2))}\n\n"

        groups = defaultdict(lambda: {"count": 0, "total_salary": 0.0, "total_rating": 0.0, "max_salary": 0.0, "min_salary": float("inf")})
        for row in filtered:
            dept = row["department"]
            g = groups[dept]
            g["count"] += 1
            g["total_salary"] += row["salary"]
            g["total_rating"] += row["rating"]
            if row["salary"] > g["max_salary"]:
                g["max_salary"] = row["salary"]
            if row["salary"] < g["min_salary"]:
                g["min_salary"] = row["salary"]

        dept_stats = []
        for dept, g in groups.items():
            dept_stats.append({
                "department": dept,
                "count": g["count"],
                "avg_salary": round(g["total_salary"] / g["count"], 2),
                "max_salary": g["max_salary"],
                "min_salary": g["min_salary"],
                "avg_rating": round(g["total_rating"] / g["count"], 2),
            })

        yield f"data: {json.dumps(tracker.stage_complete(2, t))}\n\n"

        # Stage 3: Join filtered rows with dept stats and sort
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(3))}\n\n"

        dept_lookup = {d["department"]: d for d in dept_stats}
        joined = []
        for row in filtered:
            stats = dept_lookup[row["department"]]
            joined.append({
                "name": row["name"],
                "department": row["department"],
                "salary": row["salary"],
                "dept_avg_salary": stats["avg_salary"],
                "dept_avg_rating": stats["avg_rating"],
            })

        result = sorted(joined, key=lambda x: x["salary"], reverse=True)

        yield f"data: {json.dumps(tracker.stage_complete(3, t))}\n\n"
        yield f"data: {json.dumps(tracker.finish())}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
