import asyncio
import json

from fastapi import APIRouter, Request
from app.models.page4_polymorphism import (
    SourceInfo,
    SourcesResponse,
    ExecutePolymorphismRequest,
    PolymorphismEvent,
    ClassHierarchyInfo,
    ChildClassInfo,
)
from app.sse.stream import sse_response

router = APIRouter()

# Pre-built polymorphic data sources — same .read() interface, different implementations
_SOURCES: dict[str, SourceInfo] = {
    "CsvSource": SourceInfo(
        class_name="CsvSource",
        description="Reads data from a CSV file, parsing rows into dictionaries.",
        read_method_body='with open(self.path) as f:\n    reader = csv.DictReader(f)\n    return list(reader)',
    ),
    "ParquetSource": SourceInfo(
        class_name="ParquetSource",
        description="Reads columnar data from a Parquet file using PyArrow.",
        read_method_body="table = pq.read_table(self.path)\nreturn table.to_pydict()",
    ),
    "ApiSource": SourceInfo(
        class_name="ApiSource",
        description="Fetches data from a REST API endpoint as JSON.",
        read_method_body='response = requests.get(self.url)\nresponse.raise_for_status()\nreturn response.json()',
    ),
}

# Simulated output for each source's .read()
_SIMULATED_OUTPUT: dict[str, str] = {
    "CsvSource": '[{"id": 1, "name": "Alice", "role": "engineer"}, {"id": 2, "name": "Bob", "role": "analyst"}]',
    "ParquetSource": '{"id": [1, 2, 3], "value": [10.5, 20.3, 30.1], "timestamp": ["2025-01-01", "2025-01-02", "2025-01-03"]}',
    "ApiSource": '{"status": "ok", "results": [{"metric": "cpu", "value": 72.5}, {"metric": "memory", "value": 58.1}]}',
}


_HIERARCHY = ClassHierarchyInfo(
    base_class_name="DataSource",
    base_class_code="from abc import ABC, abstractmethod\n\nclass DataSource(ABC):\n    @abstractmethod\n    def read(self) -> Any:\n        \"\"\"Read data from the source.\"\"\"\n        ...",
    children=[
        ChildClassInfo(
            class_name="CsvSource",
            class_code="class CsvSource(DataSource):\n    def __init__(self, path: str):\n        self.path = path\n\n    def read(self):\n        with open(self.path) as f:\n            reader = csv.DictReader(f)\n            return list(reader)",
        ),
        ChildClassInfo(
            class_name="ParquetSource",
            class_code="class ParquetSource(DataSource):\n    def __init__(self, path: str):\n        self.path = path\n\n    def read(self):\n        table = pq.read_table(self.path)\n        return table.to_pydict()",
        ),
        ChildClassInfo(
            class_name="ApiSource",
            class_code='class ApiSource(DataSource):\n    def __init__(self, url: str):\n        self.url = url\n\n    def read(self):\n        response = requests.get(self.url)\n        response.raise_for_status()\n        return response.json()',
        ),
    ],
)


@router.get("/sources", response_model=SourcesResponse)
def list_sources():
    return SourcesResponse(
        sources=list(_SOURCES.values()),
        hierarchy=_HIERARCHY,
    )


@router.post("/execute")
async def execute_polymorphism(req: ExecutePolymorphismRequest, request: Request):
    """SSE endpoint — streams PolymorphismEvent as data flows through sources."""

    async def event_stream():
        for class_name in req.source_class_names:
            if class_name not in _SOURCES:
                yield {
                    "event": "error",
                    "data": json.dumps(
                        PolymorphismEvent(
                            source_class=class_name,
                            event_type="error",
                            message=f"Unknown source: '{class_name}'",
                        ).model_dump()
                    ),
                }
                continue

            # start
            yield {
                "event": "start",
                "data": json.dumps(
                    PolymorphismEvent(
                        source_class=class_name,
                        event_type="start",
                        message=f"{class_name}.read() called",
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.3)

            # progress
            yield {
                "event": "progress",
                "data": json.dumps(
                    PolymorphismEvent(
                        source_class=class_name,
                        event_type="progress",
                        message=f"{class_name} reading data...",
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.5)

            # result
            yield {
                "event": "result",
                "data": json.dumps(
                    PolymorphismEvent(
                        source_class=class_name,
                        event_type="result",
                        message=f"{class_name}.read() completed",
                        data=_SIMULATED_OUTPUT.get(class_name, "{}"),
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.2)

    return sse_response(event_stream())
