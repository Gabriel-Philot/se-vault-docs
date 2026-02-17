import json
import time
import sys

import duckdb
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

        # Stage 1: Read CSV and filter directly into a table
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(1))}\n\n"

        con = duckdb.connect()
        con.sql(f"""
            CREATE TABLE filtered AS
            SELECT * FROM read_csv('{DATA_PATH}', auto_detect=true)
            WHERE active = true AND salary > 50000
        """)

        yield f"data: {json.dumps(tracker.stage_complete(1, t))}\n\n"

        # Stage 2: Group by department and aggregate with SQL
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(2))}\n\n"

        con.sql("""
            CREATE TABLE dept_stats AS
            SELECT
                department,
                COUNT(*) AS count,
                ROUND(AVG(salary), 2) AS avg_salary,
                MAX(salary) AS max_salary,
                MIN(salary) AS min_salary,
                ROUND(AVG(rating), 2) AS avg_rating
            FROM filtered
            GROUP BY department
        """)

        yield f"data: {json.dumps(tracker.stage_complete(2, t))}\n\n"

        # Stage 3: Join and sort - only count the result, don't materialize in Python
        t = time.perf_counter()
        yield f"data: {json.dumps(tracker.stage_start(3))}\n\n"

        result = con.sql("""
            SELECT COUNT(*) FROM (
                SELECT
                    f.name,
                    f.department,
                    f.salary,
                    d.avg_salary AS dept_avg_salary,
                    d.avg_rating AS dept_avg_rating
                FROM filtered f
                JOIN dept_stats d ON f.department = d.department
                ORDER BY f.salary DESC
            )
        """).fetchone()
        _ = result

        con.close()

        yield f"data: {json.dumps(tracker.stage_complete(3, t))}\n\n"
        yield f"data: {json.dumps(tracker.finish())}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
