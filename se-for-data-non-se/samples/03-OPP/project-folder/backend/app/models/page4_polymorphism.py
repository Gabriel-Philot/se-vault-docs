from pydantic import BaseModel
from .common import ExecutionResult


class SourceInfo(BaseModel):
    class_name: str
    description: str
    read_method_body: str


class SourcesResponse(BaseModel):
    sources: list[SourceInfo]


class ExecutePolymorphismRequest(BaseModel):
    source_class_names: list[str]


class PolymorphismEvent(BaseModel):
    source_class: str
    event_type: str  # "start", "progress", "result", "error"
    message: str
    data: str | None = None
