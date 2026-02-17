from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

import httpx

from src.models import RaceResult, RaceState


RUNNERS: dict[str, str] = {
    "pure-python": "http://pure-python:8001",
    "pandas": "http://pandas-car:8002",
    "polars": "http://polars-car:8003",
    "duckdb": "http://duckdb-car:8004",
}


class RaceManager:
    def __init__(self) -> None:
        self._state = RaceState.IDLE
        self._results: list[RaceResult] | None = None

    def get_state(self) -> RaceState:
        return self._state

    def get_results(self) -> list[RaceResult] | None:
        return self._results

    async def check_runners_health(self) -> dict[str, str]:
        statuses: dict[str, str] = {}
        async with httpx.AsyncClient(timeout=5.0) as client:
            for name, url in RUNNERS.items():
                try:
                    resp = await client.get(f"{url}/health")
                    statuses[name] = "ok" if resp.status_code == 200 else "error"
                except httpx.HTTPError:
                    statuses[name] = "unreachable"
        return statuses

    async def start_race(self) -> AsyncIterator[str]:
        self._state = RaceState.RUNNING
        self._results = None

        queue: asyncio.Queue[str | None] = asyncio.Queue()
        runner_results: dict[str, RaceResult] = {}

        async def consume_runner(
            client: httpx.AsyncClient, name: str, url: str
        ) -> None:
            stage_times: list[float] = []
            total_ms = 0.0
            peak_memory_mb = 0.0
            try:
                async with client.stream("POST", f"{url}/run") as resp:
                    buffer = ""
                    async for chunk in resp.aiter_text():
                        buffer += chunk
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line.startswith("data:"):
                                continue
                            payload = line[len("data:"):].strip()
                            try:
                                event = json.loads(payload)
                            except json.JSONDecodeError:
                                continue
                            event["runner"] = name

                            if event.get("elapsed_ms") is not None:
                                stage_times.append(event["elapsed_ms"])
                            if event.get("total_ms") is not None:
                                total_ms = event["total_ms"]
                            if event.get("peak_memory_mb") is not None:
                                peak_memory_mb = event["peak_memory_mb"]

                            sse_line = f"data: {json.dumps(event)}\n\n"
                            await queue.put(sse_line)
            except Exception as exc:
                error_event = {
                    "event": "error",
                    "runner": name,
                    "status": str(exc),
                }
                await queue.put(f"data: {json.dumps(error_event)}\n\n")

            runner_results[name] = RaceResult(
                runner=name,
                total_ms=total_ms,
                peak_memory_mb=peak_memory_mb,
                stage_times=stage_times,
            )

        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
            tasks = [
                asyncio.create_task(consume_runner(client, name, url))
                for name, url in RUNNERS.items()
            ]

            done_count = 0
            total = len(tasks)

            # Monitor task completion via a callback
            finished_event = asyncio.Event()

            def _on_done(_: asyncio.Task) -> None:  # type: ignore[type-arg]
                nonlocal done_count
                done_count += 1
                if done_count == total:
                    finished_event.set()

            for t in tasks:
                t.add_done_callback(_on_done)

            # Yield events from the queue until all runners finish
            while not finished_event.is_set() or not queue.empty():
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=0.5)
                except asyncio.TimeoutError:
                    continue
                if item is not None:
                    yield item

            # Drain any remaining items
            while not queue.empty():
                item = queue.get_nowait()
                if item is not None:
                    yield item

        # Sort by total_ms, putting errored runners (total_ms == 0) last
        self._results = sorted(
            runner_results.values(),
            key=lambda r: r.total_ms if r.total_ms > 0 else float("inf"),
        )
        self._state = RaceState.FINISHED

        finish_event = {
            "event": "race_finished",
            "results": [r.model_dump() for r in self._results],
        }
        yield f"data: {json.dumps(finish_event)}\n\n"
