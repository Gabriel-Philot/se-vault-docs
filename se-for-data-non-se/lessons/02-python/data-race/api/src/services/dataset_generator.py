from __future__ import annotations

import asyncio
import csv
import json
import os
import queue
import random
import time
from collections.abc import Iterator
from datetime import date
from typing import AsyncIterator

from faker import Faker

DATA_PATH = os.getenv("DATA_PATH", "/data/dataset.csv")
NUM_ROWS = 1_000_000
PROGRESS_EVERY = 100_000

DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Legal", "Support"]

_generating = False


def _generate_sync() -> Iterator[dict]:
    """Synchronous generator that yields SSE-formatted progress events."""
    fake = Faker()
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    fieldnames = ["id", "name", "city", "department", "salary", "hire_date", "rating", "active"]

    start = time.time()
    with open(DATA_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i in range(1, NUM_ROWS + 1):
            writer.writerow({
                "id": i,
                "name": fake.name(),
                "city": fake.city(),
                "department": random.choice(DEPARTMENTS),
                "salary": random.randint(30000, 150000),
                "hire_date": fake.date_between(start_date=date(2015, 1, 1), end_date=date(2024, 12, 31)).isoformat(),
                "rating": round(random.uniform(1.0, 5.0), 1),
                "active": random.random() < 0.7,
            })

            if i % PROGRESS_EVERY == 0:
                yield {
                    "event": "progress",
                    "rows": i,
                    "total": NUM_ROWS,
                    "percent": round(i * 100 / NUM_ROWS),
                }

    elapsed = round(time.time() - start, 1)
    size_mb = round(os.path.getsize(DATA_PATH) / (1024 * 1024), 2)
    yield {
        "event": "completed",
        "rows": NUM_ROWS,
        "size_mb": size_mb,
        "elapsed_s": elapsed,
    }


async def generate_dataset_stream() -> AsyncIterator[str]:
    """Async generator that runs dataset generation in a thread and yields SSE events."""
    global _generating
    _generating = True
    try:
        q: queue.Queue[dict | None] = queue.Queue()

        def _run():
            try:
                for event in _generate_sync():
                    q.put(event)
            finally:
                q.put(None)

        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, _run)

        while True:
            # Poll the queue without blocking the event loop
            try:
                event = q.get_nowait()
            except queue.Empty:
                await asyncio.sleep(0.1)
                continue

            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"
    finally:
        _generating = False


def is_generating() -> bool:
    return _generating


def dataset_exists() -> bool:
    return os.path.isfile(DATA_PATH)
