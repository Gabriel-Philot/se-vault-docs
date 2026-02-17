from pydantic import BaseModel
from .common import ExecutionResult


class SourceInfo(BaseModel):
    class_name: str
    description: str
    read_method_body: str


class ChildClassInfo(BaseModel):
    class_name: str
    class_code: str


class ClassHierarchyInfo(BaseModel):
    base_class_name: str
    base_class_code: str
    children: list[ChildClassInfo]


class SourcesResponse(BaseModel):
    sources: list[SourceInfo]
    hierarchy: ClassHierarchyInfo | None = None


class ExecutePolymorphismRequest(BaseModel):
    source_class_names: list[str]


class PolymorphismEvent(BaseModel):
    source_class: str
    event_type: str  # "start", "progress", "result", "error"
    message: str
    data: str | None = None
